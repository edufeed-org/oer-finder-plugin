import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  HttpException,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { AssetSigningService } from '../services/asset-signing.service';

const ALLOWED_SCHEMES = new Set(['http:', 'https:']);
const DEFAULT_CACHE_TTL_SECONDS = 86400;

@ApiTags('Assets')
@Controller('api/v1/assets')
@UseGuards(ThrottlerGuard)
export class AssetRedirectController {
  private readonly logger = new Logger(AssetRedirectController.name);

  constructor(private readonly assetSigningService: AssetSigningService) {}

  @Get(':signature')
  @ApiOperation({
    summary: 'Redirect to a signed asset URL',
    description:
      'Validates the HMAC signature and expiration, then redirects (302) to the original asset URL.',
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
    status: 302,
    description: 'Redirects to the original asset URL',
  })
  @ApiResponse({
    status: 400,
    description: 'Missing or malformed parameters',
  })
  @ApiResponse({
    status: 403,
    description: 'Invalid or expired signature',
  })
  redirect(
    @Param('signature') signature: string,
    @Query('url') urlEncoded: string,
    @Query('exp') expString: string,
    @Res() res: Response,
  ): void {
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

    const now = Math.floor(Date.now() / 1000);
    const remainingTtl =
      exp > 0 ? Math.max(exp - now, 0) : DEFAULT_CACHE_TTL_SECONDS;
    // private: signed URLs contain time-limited tokens, prevent CDN caching
    res.setHeader('Cache-Control', `private, max-age=${remainingTtl}`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');

    res.redirect(302, originalUrl);
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
        `Blocked redirect to disallowed scheme: ${parsed.protocol}`,
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
}
