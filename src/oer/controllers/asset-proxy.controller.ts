import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  Req,
  HttpException,
  HttpStatus,
  Logger,
  UseGuards,
  UseFilters,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { Readable } from 'node:stream';
import { lookup } from 'node:dns/promises';
import { AssetSigningService } from '../services/asset-signing.service';
import { AssetCorpExceptionFilter } from '../filters/asset-corp-exception.filter';
import { AssetProxyEnabledGuard } from '../guards/asset-proxy-enabled.guard';
import { isPrivateIp } from '../utils/is-private-ip';

const ALLOWED_SCHEMES = new Set(['http:', 'https:']);
const DEFAULT_CACHE_TTL_SECONDS = 86400;
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

const ALLOWED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

@ApiTags('Assets')
@Controller('api/v1/assets')
@UseGuards(AssetProxyEnabledGuard, ThrottlerGuard)
@UseFilters(AssetCorpExceptionFilter)
export class AssetProxyController {
  private readonly logger = new Logger(AssetProxyController.name);
  private readonly timeoutMs: number;
  private readonly allowedDomains: ReadonlyArray<string>;

  constructor(
    private readonly assetSigningService: AssetSigningService,
    private readonly configService: ConfigService,
  ) {
    this.timeoutMs = this.configService.get<number>(
      'app.assetProxy.timeoutMs',
      15000,
    );
    this.allowedDomains = this.configService.get<string[]>(
      'app.assetProxy.allowedDomains',
      [],
    );
  }

  @Get(':signature')
  @ApiOperation({
    summary: 'Proxy a signed asset image',
    description:
      'Validates the HMAC signature and expiration, then fetches and streams the image through the proxy.',
  })
  @ApiParam({
    name: 'signature',
    description: 'HMAC-SHA256 signature (base64url encoded)',
  })
  @ApiQuery({ name: 'url', description: 'Base64url-encoded source URL' })
  @ApiQuery({
    name: 'exp',
    description: 'Expiration timestamp (Unix seconds)',
  })
  @ApiResponse({
    status: 200,
    description: 'Proxied image content',
  })
  @ApiResponse({
    status: 400,
    description: 'Missing or malformed parameters',
  })
  @ApiResponse({
    status: 403,
    description: 'Invalid or expired signature, or disallowed content type',
  })
  @ApiResponse({
    status: 502,
    description: 'Upstream server error',
  })
  @ApiResponse({
    status: 504,
    description: 'Upstream fetch timeout',
  })
  async proxy(
    @Param('signature') signature: string,
    @Query('url') urlEncoded: string,
    @Query('exp') expString: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const { originalUrl, exp } = this.validateAndVerifySignature(
      signature,
      urlEncoded,
      expString,
    );

    await this.validateHostAddress(originalUrl);

    const upstream = await this.fetchUpstream(originalUrl, req);
    if (upstream === null) {
      return;
    }

    await this.validateUpstreamResponse(upstream, originalUrl);

    this.setResponseHeaders(res, upstream, exp);
    this.streamResponse(upstream, res, originalUrl);
  }

  private validateAndVerifySignature(
    signature: string,
    urlEncoded: string,
    expString: string,
  ): { originalUrl: string; exp: number } {
    if (!signature || !urlEncoded || expString === undefined) {
      throw new HttpException(
        { statusCode: HttpStatus.BAD_REQUEST, message: 'Missing parameters' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const exp = parseInt(expString, 10);
    if (isNaN(exp)) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid expiration',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const originalUrl = this.assetSigningService.verify(
      signature,
      urlEncoded,
      exp,
    );

    if (originalUrl === null) {
      this.logger.warn('Invalid or expired asset signature');
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Invalid or expired signature',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    this.validateUrlScheme(originalUrl);

    return { originalUrl, exp };
  }

  private async validateHostAddress(url: string): Promise<void> {
    const parsed = new URL(url);
    const hostnameValue = parsed.hostname.toLowerCase();

    if (this.allowedDomains.length > 0) {
      const isAllowed = this.allowedDomains.some(
        (domain) =>
          hostnameValue === domain || hostnameValue.endsWith(`.${domain}`),
      );
      if (!isAllowed) {
        this.logger.warn(
          `Blocked proxy to non-allowlisted domain: ${hostnameValue}`,
        );
        throw new HttpException(
          {
            statusCode: HttpStatus.FORBIDDEN,
            message: 'Domain not allowed',
          },
          HttpStatus.FORBIDDEN,
        );
      }
    }

    // Check if hostname is an IP literal
    if (isPrivateIp(hostnameValue)) {
      this.logger.warn(`Blocked proxy to private IP: ${hostnameValue}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Requests to private addresses are not allowed',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    // Resolve DNS and check the resolved IP
    try {
      const { address } = await lookup(hostnameValue);
      if (isPrivateIp(address)) {
        this.logger.warn(
          `Blocked proxy: hostname ${hostnameValue} resolved to private IP ${address}`,
        );
        throw new HttpException(
          {
            statusCode: HttpStatus.FORBIDDEN,
            message: 'Requests to private addresses are not allowed',
          },
          HttpStatus.FORBIDDEN,
        );
      }
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.warn(`DNS resolution failed for ${hostnameValue}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'DNS resolution failed',
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  private async fetchUpstream(
    originalUrl: string,
    req: Request,
  ): Promise<globalThis.Response | null> {
    const clientAbort = new AbortController();
    req.on('close', () => {
      clientAbort.abort();
    });

    const signal = AbortSignal.any([
      clientAbort.signal,
      AbortSignal.timeout(this.timeoutMs),
    ]);

    try {
      return await fetch(originalUrl, {
        signal,
        headers: { Accept: 'image/*' },
        redirect: 'follow',
      });
    } catch (error: unknown) {
      if (clientAbort.signal.aborted) {
        return null;
      }
      if (this.isTimeoutError(error)) {
        throw new HttpException(
          {
            statusCode: HttpStatus.GATEWAY_TIMEOUT,
            message: 'Upstream timeout',
          },
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }
      this.logger.error(`Upstream fetch failed: ${error}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Upstream fetch failed',
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  private async validateUpstreamResponse(
    upstream: globalThis.Response,
    originalUrl: string,
  ): Promise<void> {
    if (!upstream.ok) {
      await upstream.body?.cancel();
      this.handleUpstreamError(upstream.status, originalUrl);
    }

    const contentType = this.extractMimeType(
      upstream.headers.get('content-type'),
    );
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      await upstream.body?.cancel();
      this.logger.warn(
        `Blocked disallowed content-type: ${contentType} from ${hostname(originalUrl)}`,
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Only image content types are allowed',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    const contentLength = upstream.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_IMAGE_SIZE_BYTES) {
      await upstream.body?.cancel();
      this.logger.warn(
        `Blocked oversized image (${contentLength} bytes) from ${hostname(originalUrl)}`,
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Upstream image exceeds size limit',
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  private handleUpstreamError(status: number, originalUrl: string): never {
    if (status === 404) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Upstream resource not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
    if (status === 403) {
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Upstream access denied',
        },
        HttpStatus.FORBIDDEN,
      );
    }
    this.logger.warn(
      `Upstream returned ${status} for ${hostname(originalUrl)}`,
    );
    throw new HttpException(
      { statusCode: HttpStatus.BAD_GATEWAY, message: 'Upstream error' },
      HttpStatus.BAD_GATEWAY,
    );
  }

  private setResponseHeaders(
    res: Response,
    upstream: globalThis.Response,
    exp: number,
  ): void {
    const now = Math.floor(Date.now() / 1000);
    const remainingTtl =
      exp > 0 ? Math.max(exp - now, 0) : DEFAULT_CACHE_TTL_SECONDS;

    const contentType = this.extractMimeType(
      upstream.headers.get('content-type'),
    );

    res.setHeader('Cache-Control', `private, max-age=${remainingTtl}`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('Content-Type', contentType);

    const contentLength = upstream.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
  }

  private streamResponse(
    upstream: globalThis.Response,
    res: Response,
    originalUrl: string,
  ): void {
    if (!upstream.body) {
      res.status(200).end();
      return;
    }

    const readable = Readable.fromWeb(
      upstream.body as import('node:stream/web').ReadableStream,
    );
    readable.on('error', (err) => {
      this.logger.error(
        `Stream error while proxying ${hostname(originalUrl)}: ${err}`,
      );
      if (!res.headersSent) {
        res.status(502).json({
          statusCode: 502,
          message: 'Stream error',
        });
      } else {
        res.destroy();
      }
    });

    readable.pipe(res);
  }

  private extractMimeType(contentTypeHeader: string | null): string {
    if (!contentTypeHeader) {
      return '';
    }
    return contentTypeHeader.split(';')[0].trim().toLowerCase();
  }

  private validateUrlScheme(url: string): void {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new HttpException(
        { statusCode: HttpStatus.BAD_REQUEST, message: 'Invalid asset URL' },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
      this.logger.warn(
        `Blocked proxy to disallowed scheme: ${parsed.protocol}`,
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Disallowed URL scheme',
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private isTimeoutError(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'TimeoutError';
  }
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '<invalid>';
  }
}
