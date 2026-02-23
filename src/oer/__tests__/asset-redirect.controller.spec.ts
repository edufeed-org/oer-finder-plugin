import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { AssetRedirectController } from '../controllers/asset-redirect.controller';
import { AssetSigningService } from '../services/asset-signing.service';

class MockThrottlerGuard {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

type MockResponse = Pick<Response, 'setHeader' | 'redirect'>;

describe('AssetRedirectController', () => {
  let controller: AssetRedirectController;
  let assetSigningService: jest.Mocked<AssetSigningService>;

  const createMockResponse = (): jest.Mocked<MockResponse> => ({
    setHeader: jest
      .fn()
      .mockReturnThis() as jest.Mocked<MockResponse>['setHeader'],
    redirect: jest.fn() as jest.Mocked<MockResponse>['redirect'],
  });

  beforeEach(async () => {
    assetSigningService = {
      isEnabled: jest.fn().mockReturnValue(true),
      verify: jest.fn(),
      generateSignedPath: jest.fn(),
      generateSignedUrl: jest.fn(),
    } as unknown as jest.Mocked<AssetSigningService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetRedirectController],
      providers: [
        { provide: AssetSigningService, useValue: assetSigningService },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useClass(MockThrottlerGuard)
      .compile();

    controller = module.get<AssetRedirectController>(AssetRedirectController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return 302 redirect with correct URL for valid signature', () => {
    const originalUrl = 'https://example.com/image.jpg';
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    assetSigningService.verify.mockReturnValue(originalUrl);
    const res = createMockResponse();

    controller.redirect(
      'valid-sig',
      'encoded-url',
      futureExp.toString(),
      res as unknown as Response,
    );

    expect(assetSigningService.verify).toHaveBeenCalledWith(
      'valid-sig',
      'encoded-url',
      futureExp,
    );
    expect(res.redirect).toHaveBeenCalledWith(302, originalUrl);
  });

  it('should set security headers on successful redirect', () => {
    assetSigningService.verify.mockReturnValue('https://example.com/image.jpg');
    const res = createMockResponse();

    controller.redirect('sig', 'url', '0', res as unknown as Response);

    const headers = Object.fromEntries(
      res.setHeader.mock.calls.map(
        ([name, value]: [string, string]) => [name, value] as const,
      ),
    );
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Referrer-Policy']).toBe('no-referrer');
    expect(headers['Cache-Control']).toMatch(/^private, max-age=\d+$/);
  });

  it('should set max-age=86400 when exp is 0 (no expiration)', () => {
    assetSigningService.verify.mockReturnValue('https://example.com/image.jpg');
    const res = createMockResponse();

    controller.redirect(
      'valid-sig',
      'encoded-url',
      '0',
      res as unknown as Response,
    );

    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'private, max-age=86400',
    );
  });

  it('should return 403 for invalid signature', () => {
    assetSigningService.verify.mockReturnValue(null);
    const res = createMockResponse();

    expect(() =>
      controller.redirect(
        'bad-sig',
        'encoded-url',
        '9999999999',
        res as unknown as Response,
      ),
    ).toThrow(expect.objectContaining({ status: HttpStatus.FORBIDDEN }));
  });

  it('should return 400 for non-numeric exp parameter', () => {
    const res = createMockResponse();

    expect(() =>
      controller.redirect(
        'sig',
        'encoded-url',
        'not-a-number',
        res as unknown as Response,
      ),
    ).toThrow(expect.objectContaining({ status: HttpStatus.BAD_REQUEST }));
  });

  it('should return 400 when url parameter is missing', () => {
    const res = createMockResponse();

    expect(() =>
      controller.redirect('sig', '', '12345', res as unknown as Response),
    ).toThrow(expect.objectContaining({ status: HttpStatus.BAD_REQUEST }));
  });

  it('should return 400 when signature is an empty string', () => {
    const res = createMockResponse();

    expect(() =>
      controller.redirect(
        '',
        'encoded-url',
        '12345',
        res as unknown as Response,
      ),
    ).toThrow(expect.objectContaining({ status: HttpStatus.BAD_REQUEST }));
  });

  it('should return 403 for disallowed URL schemes', () => {
    assetSigningService.verify.mockReturnValue('javascript:alert(1)');
    const res = createMockResponse();

    expect(() =>
      controller.redirect(
        'sig',
        'encoded-url',
        '0',
        res as unknown as Response,
      ),
    ).toThrow(expect.objectContaining({ status: HttpStatus.FORBIDDEN }));
  });

  it('should return 400 for invalid URL format', () => {
    assetSigningService.verify.mockReturnValue('not-a-valid-url');
    const res = createMockResponse();

    expect(() =>
      controller.redirect(
        'sig',
        'encoded-url',
        '0',
        res as unknown as Response,
      ),
    ).toThrow(expect.objectContaining({ status: HttpStatus.BAD_REQUEST }));
  });
});
