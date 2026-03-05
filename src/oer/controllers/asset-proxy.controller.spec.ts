import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { PassThrough } from 'node:stream';
import * as dnsPromises from 'node:dns/promises';
import { AssetProxyController } from './asset-proxy.controller';
import { AssetSigningService } from '../services/asset-signing.service';
import { AssetProxyEnabledGuard } from '../guards/asset-proxy-enabled.guard';

jest.mock('node:dns/promises', () => ({
  lookup: jest.fn(),
}));

class MockAssetProxyEnabledGuard {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

const mockLookup = dnsPromises.lookup as jest.MockedFunction<
  typeof dnsPromises.lookup
>;

class MockThrottlerGuard {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

interface MockResponse {
  setHeader: jest.Mock;
  status: jest.Mock;
  end: jest.Mock;
  destroy: jest.Mock;
  headersSent: boolean;
}

interface MockRequest {
  on: jest.Mock;
}

function createMockResponse(): jest.Mocked<MockResponse> {
  const mock: MockResponse = {
    setHeader: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    end: jest.fn(),
    destroy: jest.fn(),
    headersSent: false,
  };
  return mock as jest.Mocked<MockResponse>;
}

function createMockRequest(): jest.Mocked<MockRequest> {
  return {
    on: jest.fn(),
  } as jest.Mocked<MockRequest>;
}

function expectThrowsWithStatus(
  fn: () => void | Promise<void>,
  status: HttpStatus,
): Promise<void> {
  const result = fn();
  const promise = result instanceof Promise ? result : Promise.resolve(result);
  return promise.then(
    () => {
      throw new Error('Expected function to throw');
    },
    (error: unknown) => {
      expect(error).toHaveProperty('status', status);
    },
  );
}

const originalUrl = 'https://example.com/image.jpg';

describe('AssetProxyController', () => {
  let controller: AssetProxyController;
  let assetSigningService: jest.Mocked<AssetSigningService>;
  let mockFetch: jest.SpyInstance;

  beforeEach(async () => {
    assetSigningService = {
      isEnabled: jest.fn().mockReturnValue(true),
      verify: jest.fn(),
      generateSignedPath: jest.fn(),
      generateSignedUrl: jest.fn(),
    } as unknown as jest.Mocked<AssetSigningService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetProxyController],
      providers: [
        { provide: AssetSigningService, useValue: assetSigningService },
        {
          provide: ConfigService,
          useValue: {
            get: jest
              .fn()
              .mockImplementation((key: string, defaultValue: unknown) => {
                if (key === 'app.assetProxy.timeoutMs') return 15000;
                if (key === 'app.assetProxy.allowedDomains') return [];
                return defaultValue;
              }),
          },
        },
      ],
    })
      .overrideGuard(AssetProxyEnabledGuard)
      .useClass(MockAssetProxyEnabledGuard)
      .overrideGuard(ThrottlerGuard)
      .useClass(MockThrottlerGuard)
      .compile();

    controller = module.get<AssetProxyController>(AssetProxyController);

    mockFetch = jest.spyOn(globalThis, 'fetch');

    // Default: DNS resolves to a public IP
    mockLookup.mockResolvedValue({
      address: '93.184.216.34',
      family: 4,
    } as Awaited<ReturnType<typeof dnsPromises.lookup>>);
  });

  afterEach(() => {
    mockFetch.mockRestore();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should stream image content for valid signature using pinned IP', async () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    assetSigningService.verify.mockReturnValue(originalUrl);

    const mockBody = new ReadableStream({
      start(ctrl) {
        ctrl.enqueue(new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
        ctrl.close();
      },
    });

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'content-type': 'image/png',
        'content-length': '4',
      }),
      body: mockBody,
    });

    const req = createMockRequest();
    const passThrough = new PassThrough();
    const setHeader = jest.fn().mockReturnThis();
    const mockRes = Object.assign(passThrough, {
      setHeader,
      status: jest.fn().mockReturnThis(),
      end: jest.fn(),
      headersSent: false,
    });

    await controller.proxy(
      'valid-sig',
      'encoded-url',
      futureExp.toString(),
      req as unknown as Request,
      mockRes as unknown as Response,
    );

    expect(assetSigningService.verify).toHaveBeenCalledWith(
      'valid-sig',
      'encoded-url',
      futureExp,
    );
    expect(setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
    expect(setHeader).toHaveBeenCalledWith('Content-Length', '4');

    // Verify fetch was called with pinned IP URL and Host header
    const [fetchUrl, fetchOpts] = mockFetch.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(fetchUrl).toBe('https://93.184.216.34/image.jpg');
    expect(fetchOpts.headers).toEqual(
      expect.objectContaining({ Host: 'example.com' }),
    );
    expect(fetchOpts.redirect).toBe('manual');
  });

  it('should set security headers including CSP on successful proxy', async () => {
    assetSigningService.verify.mockReturnValue(originalUrl);

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'image/jpeg' }),
      body: null,
    });

    const res = createMockResponse();
    const req = createMockRequest();

    await controller.proxy(
      'sig',
      'url',
      '0',
      req as unknown as Request,
      res as unknown as Response,
    );

    const headers = Object.fromEntries(
      res.setHeader.mock.calls.map(
        ([name, value]: [string, string]) => [name, value] as const,
      ),
    );
    expect(headers).toEqual(
      expect.objectContaining({
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Content-Security-Policy': "default-src 'none'",
        'Cache-Control': expect.stringMatching(/^private, max-age=\d+$/),
      }),
    );
  });

  it('should set max-age=86400 when exp is 0 (no expiration)', async () => {
    assetSigningService.verify.mockReturnValue(originalUrl);

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'image/jpeg' }),
      body: null,
    });

    const res = createMockResponse();
    const req = createMockRequest();

    await controller.proxy(
      'valid-sig',
      'encoded-url',
      '0',
      req as unknown as Request,
      res as unknown as Response,
    );

    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'private, max-age=86400',
    );
  });

  it('should return 403 for invalid signature', async () => {
    assetSigningService.verify.mockReturnValue(null);
    const res = createMockResponse();
    const req = createMockRequest();

    await expectThrowsWithStatus(
      () =>
        controller.proxy(
          'bad-sig',
          'encoded-url',
          '9999999999',
          req as unknown as Request,
          res as unknown as Response,
        ),
      HttpStatus.FORBIDDEN,
    );
  });

  it('should return 400 for non-numeric exp parameter', async () => {
    const res = createMockResponse();
    const req = createMockRequest();

    await expectThrowsWithStatus(
      () =>
        controller.proxy(
          'sig',
          'encoded-url',
          'not-a-number',
          req as unknown as Request,
          res as unknown as Response,
        ),
      HttpStatus.BAD_REQUEST,
    );
  });

  it('should return 400 when url parameter is missing', async () => {
    const res = createMockResponse();
    const req = createMockRequest();

    await expectThrowsWithStatus(
      () =>
        controller.proxy(
          'sig',
          '',
          '12345',
          req as unknown as Request,
          res as unknown as Response,
        ),
      HttpStatus.BAD_REQUEST,
    );
  });

  it('should return 400 when signature is an empty string', async () => {
    const res = createMockResponse();
    const req = createMockRequest();

    await expectThrowsWithStatus(
      () =>
        controller.proxy(
          '',
          'encoded-url',
          '12345',
          req as unknown as Request,
          res as unknown as Response,
        ),
      HttpStatus.BAD_REQUEST,
    );
  });

  it('should return 403 for disallowed URL schemes', async () => {
    assetSigningService.verify.mockReturnValue('javascript:alert(1)');
    const res = createMockResponse();
    const req = createMockRequest();

    await expectThrowsWithStatus(
      () =>
        controller.proxy(
          'sig',
          'encoded-url',
          '0',
          req as unknown as Request,
          res as unknown as Response,
        ),
      HttpStatus.FORBIDDEN,
    );
  });

  it('should return 400 for invalid URL format', async () => {
    assetSigningService.verify.mockReturnValue('not-a-valid-url');
    const res = createMockResponse();
    const req = createMockRequest();

    await expectThrowsWithStatus(
      () =>
        controller.proxy(
          'sig',
          'encoded-url',
          '0',
          req as unknown as Request,
          res as unknown as Response,
        ),
      HttpStatus.BAD_REQUEST,
    );
  });

  it('should return 403 for non-image content types', async () => {
    assetSigningService.verify.mockReturnValue(originalUrl);

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/html' }),
      body: { cancel: jest.fn() },
    });

    const res = createMockResponse();
    const req = createMockRequest();

    await expectThrowsWithStatus(
      () =>
        controller.proxy(
          'sig',
          'encoded-url',
          '0',
          req as unknown as Request,
          res as unknown as Response,
        ),
      HttpStatus.FORBIDDEN,
    );
  });

  it('should reject SVG content type', async () => {
    assetSigningService.verify.mockReturnValue(originalUrl);

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'image/svg+xml' }),
      body: { cancel: jest.fn() },
    });

    const res = createMockResponse();
    const req = createMockRequest();

    await expectThrowsWithStatus(
      () =>
        controller.proxy(
          'sig',
          'encoded-url',
          '0',
          req as unknown as Request,
          res as unknown as Response,
        ),
      HttpStatus.FORBIDDEN,
    );
  });

  it('should return 404 when upstream returns 404', async () => {
    assetSigningService.verify.mockReturnValue(originalUrl);

    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers(),
      body: { cancel: jest.fn() },
    });

    const res = createMockResponse();
    const req = createMockRequest();

    await expectThrowsWithStatus(
      () =>
        controller.proxy(
          'sig',
          'encoded-url',
          '0',
          req as unknown as Request,
          res as unknown as Response,
        ),
      HttpStatus.NOT_FOUND,
    );
  });

  it('should return 502 when upstream returns 500', async () => {
    assetSigningService.verify.mockReturnValue(originalUrl);

    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Headers(),
      body: { cancel: jest.fn() },
    });

    const res = createMockResponse();
    const req = createMockRequest();

    await expectThrowsWithStatus(
      () =>
        controller.proxy(
          'sig',
          'encoded-url',
          '0',
          req as unknown as Request,
          res as unknown as Response,
        ),
      HttpStatus.BAD_GATEWAY,
    );
  });

  it('should return 504 on fetch timeout', async () => {
    assetSigningService.verify.mockReturnValue(originalUrl);

    const timeoutError = new DOMException('Signal timed out', 'TimeoutError');
    mockFetch.mockRejectedValue(timeoutError);

    const res = createMockResponse();
    const req = createMockRequest();
    req.on.mockImplementation(() => {
      /* noop */
    });

    await expectThrowsWithStatus(
      () =>
        controller.proxy(
          'sig',
          'encoded-url',
          '0',
          req as unknown as Request,
          res as unknown as Response,
        ),
      HttpStatus.GATEWAY_TIMEOUT,
    );
  });

  it('should return 502 on network error', async () => {
    assetSigningService.verify.mockReturnValue(originalUrl);

    mockFetch.mockRejectedValue(new TypeError('fetch failed'));

    const res = createMockResponse();
    const req = createMockRequest();
    req.on.mockImplementation(() => {
      /* noop */
    });

    await expectThrowsWithStatus(
      () =>
        controller.proxy(
          'sig',
          'encoded-url',
          '0',
          req as unknown as Request,
          res as unknown as Response,
        ),
      HttpStatus.BAD_GATEWAY,
    );
  });

  it('should silently return when client disconnects', async () => {
    assetSigningService.verify.mockReturnValue(originalUrl);

    const abortError = new DOMException(
      'The operation was aborted',
      'AbortError',
    );
    mockFetch.mockRejectedValue(abortError);

    const res = createMockResponse();
    const req = createMockRequest();

    req.on.mockImplementation((event: string, handler: () => void) => {
      if (event === 'close') {
        handler();
      }
    });

    await controller.proxy(
      'sig',
      'encoded-url',
      '0',
      req as unknown as Request,
      res as unknown as Response,
    );

    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 502 when upstream image exceeds size limit', async () => {
    assetSigningService.verify.mockReturnValue(originalUrl);

    const oversizeBytes = String(3 * 1024 * 1024); // Just above 2 MB limit
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'content-type': 'image/png',
        'content-length': oversizeBytes,
      }),
      body: { cancel: jest.fn() },
    });

    const res = createMockResponse();
    const req = createMockRequest();

    await expectThrowsWithStatus(
      () =>
        controller.proxy(
          'sig',
          'encoded-url',
          '0',
          req as unknown as Request,
          res as unknown as Response,
        ),
      HttpStatus.BAD_GATEWAY,
    );
  });

  it('should end response when upstream has no body', async () => {
    assetSigningService.verify.mockReturnValue(originalUrl);

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'image/png' }),
      body: null,
    });

    const res = createMockResponse();
    const req = createMockRequest();

    await controller.proxy(
      'sig',
      'encoded-url',
      '0',
      req as unknown as Request,
      res as unknown as Response,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.end).toHaveBeenCalled();
  });

  describe('redirect handling', () => {
    it('should follow redirect to safe URL with validated DNS', async () => {
      assetSigningService.verify.mockReturnValue(originalUrl);

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 302,
          headers: new Headers({
            location: 'https://cdn.example.com/image.jpg',
          }),
          body: null,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'image/png' }),
          body: null,
        });

      const res = createMockResponse();
      const req = createMockRequest();

      await controller.proxy(
        'sig',
        'encoded-url',
        '0',
        req as unknown as Request,
        res as unknown as Response,
      );

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockLookup).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 403 when redirect targets private IP', async () => {
      assetSigningService.verify.mockReturnValue(originalUrl);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 301,
        headers: new Headers({
          location: 'https://internal.evil.com/secret',
        }),
        body: null,
      });

      // First lookup (original) resolves to public IP, second (redirect) to private
      mockLookup
        .mockResolvedValueOnce({
          address: '93.184.216.34',
          family: 4,
        } as Awaited<ReturnType<typeof dnsPromises.lookup>>)
        .mockResolvedValueOnce({
          address: '169.254.169.254',
          family: 4,
        } as Awaited<ReturnType<typeof dnsPromises.lookup>>);

      const res = createMockResponse();
      const req = createMockRequest();

      await expectThrowsWithStatus(
        () =>
          controller.proxy(
            'sig',
            'encoded-url',
            '0',
            req as unknown as Request,
            res as unknown as Response,
          ),
        HttpStatus.FORBIDDEN,
      );
    });

    it('should return 502 when too many redirects', async () => {
      assetSigningService.verify.mockReturnValue(originalUrl);

      const redirectResponse = {
        ok: false,
        status: 302,
        headers: new Headers({
          location: 'https://example.com/next',
        }),
        body: null,
      };
      // 6 redirects (exceeds MAX_REDIRECTS=5)
      for (let i = 0; i <= 5; i++) {
        mockFetch.mockResolvedValueOnce(redirectResponse);
      }

      const res = createMockResponse();
      const req = createMockRequest();

      await expectThrowsWithStatus(
        () =>
          controller.proxy(
            'sig',
            'encoded-url',
            '0',
            req as unknown as Request,
            res as unknown as Response,
          ),
        HttpStatus.BAD_GATEWAY,
      );
    });

    it('should return 403 when redirect uses disallowed scheme', async () => {
      assetSigningService.verify.mockReturnValue(originalUrl);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 302,
        headers: new Headers({
          location: 'javascript:alert(1)',
        }),
        body: null,
      });

      const res = createMockResponse();
      const req = createMockRequest();

      await expectThrowsWithStatus(
        () =>
          controller.proxy(
            'sig',
            'encoded-url',
            '0',
            req as unknown as Request,
            res as unknown as Response,
          ),
        HttpStatus.FORBIDDEN,
      );
    });

    it('should return 502 when redirect has no location header', async () => {
      assetSigningService.verify.mockReturnValue(originalUrl);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 302,
        headers: new Headers(),
        body: null,
      });

      const res = createMockResponse();
      const req = createMockRequest();

      await expectThrowsWithStatus(
        () =>
          controller.proxy(
            'sig',
            'encoded-url',
            '0',
            req as unknown as Request,
            res as unknown as Response,
          ),
        HttpStatus.BAD_GATEWAY,
      );
    });
  });

  describe('SSRF protection', () => {
    it('should return 403 when hostname resolves to private IP', async () => {
      assetSigningService.verify.mockReturnValue(
        'https://evil.example.com/image.jpg',
      );
      mockLookup.mockResolvedValue({
        address: '127.0.0.1',
        family: 4,
      } as Awaited<ReturnType<typeof dnsPromises.lookup>>);

      const res = createMockResponse();
      const req = createMockRequest();

      await expectThrowsWithStatus(
        () =>
          controller.proxy(
            'sig',
            'encoded-url',
            '0',
            req as unknown as Request,
            res as unknown as Response,
          ),
        HttpStatus.FORBIDDEN,
      );
    });

    it('should return 502 when DNS resolution fails', async () => {
      assetSigningService.verify.mockReturnValue(
        'https://nonexistent.example.com/image.jpg',
      );
      mockLookup.mockRejectedValue(
        new Error('getaddrinfo ENOTFOUND nonexistent.example.com'),
      );

      const res = createMockResponse();
      const req = createMockRequest();

      await expectThrowsWithStatus(
        () =>
          controller.proxy(
            'sig',
            'encoded-url',
            '0',
            req as unknown as Request,
            res as unknown as Response,
          ),
        HttpStatus.BAD_GATEWAY,
      );
    });
  });
});

describe('AssetProxyController (domain allowlist)', () => {
  let controller: AssetProxyController;
  let assetSigningService: jest.Mocked<AssetSigningService>;
  let mockFetch: jest.SpyInstance;

  beforeEach(async () => {
    assetSigningService = {
      isEnabled: jest.fn().mockReturnValue(true),
      verify: jest.fn(),
      generateSignedPath: jest.fn(),
      generateSignedUrl: jest.fn(),
    } as unknown as jest.Mocked<AssetSigningService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetProxyController],
      providers: [
        { provide: AssetSigningService, useValue: assetSigningService },
        {
          provide: ConfigService,
          useValue: {
            get: jest
              .fn()
              .mockImplementation((key: string, defaultValue: unknown) => {
                if (key === 'app.assetProxy.timeoutMs') return 15000;
                if (key === 'app.assetProxy.allowedDomains')
                  return ['example.com', 'cdn.images.org'];
                return defaultValue;
              }),
          },
        },
      ],
    })
      .overrideGuard(AssetProxyEnabledGuard)
      .useClass(MockAssetProxyEnabledGuard)
      .overrideGuard(ThrottlerGuard)
      .useClass(MockThrottlerGuard)
      .compile();

    controller = module.get<AssetProxyController>(AssetProxyController);
    mockFetch = jest.spyOn(globalThis, 'fetch');

    mockLookup.mockResolvedValue({
      address: '93.184.216.34',
      family: 4,
    } as Awaited<ReturnType<typeof dnsPromises.lookup>>);
  });

  afterEach(() => {
    mockFetch.mockRestore();
    jest.clearAllMocks();
  });

  it('should allow exact domain match', async () => {
    assetSigningService.verify.mockReturnValue('https://example.com/image.jpg');
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'image/png' }),
      body: null,
    });

    const res = createMockResponse();
    const req = createMockRequest();

    await controller.proxy(
      'sig',
      'encoded-url',
      '0',
      req as unknown as Request,
      res as unknown as Response,
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should allow subdomain of allowlisted domain', async () => {
    assetSigningService.verify.mockReturnValue(
      'https://img.cdn.images.org/photo.jpg',
    );
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'image/jpeg' }),
      body: null,
    });

    const res = createMockResponse();
    const req = createMockRequest();

    await controller.proxy(
      'sig',
      'encoded-url',
      '0',
      req as unknown as Request,
      res as unknown as Response,
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 403 for non-allowlisted domain', async () => {
    assetSigningService.verify.mockReturnValue(
      'https://evil.attacker.com/image.jpg',
    );

    const res = createMockResponse();
    const req = createMockRequest();

    await expectThrowsWithStatus(
      () =>
        controller.proxy(
          'sig',
          'encoded-url',
          '0',
          req as unknown as Request,
          res as unknown as Response,
        ),
      HttpStatus.FORBIDDEN,
    );
  });

  it('should not match partial domain names', async () => {
    assetSigningService.verify.mockReturnValue(
      'https://notexample.com/image.jpg',
    );

    const res = createMockResponse();
    const req = createMockRequest();

    await expectThrowsWithStatus(
      () =>
        controller.proxy(
          'sig',
          'encoded-url',
          '0',
          req as unknown as Request,
          res as unknown as Response,
        ),
      HttpStatus.FORBIDDEN,
    );
  });
});
