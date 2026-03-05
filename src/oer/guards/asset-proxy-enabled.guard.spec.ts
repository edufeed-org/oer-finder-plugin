import { HttpStatus } from '@nestjs/common';
import { AssetProxyEnabledGuard } from './asset-proxy-enabled.guard';
import { ImgproxyService } from '../services/imgproxy.service';
import { AssetSigningService } from '../services/asset-signing.service';

describe('AssetProxyEnabledGuard', () => {
  let guard: AssetProxyEnabledGuard;
  let imgproxyService: jest.Mocked<Pick<ImgproxyService, 'isEnabled'>>;
  let assetSigningService: jest.Mocked<Pick<AssetSigningService, 'isEnabled'>>;

  beforeEach(() => {
    imgproxyService = { isEnabled: jest.fn() };
    assetSigningService = { isEnabled: jest.fn() };
    guard = new AssetProxyEnabledGuard(
      imgproxyService as unknown as ImgproxyService,
      assetSigningService as unknown as AssetSigningService,
    );
  });

  it('should allow access when imgproxy is disabled and signing is enabled', () => {
    imgproxyService.isEnabled.mockReturnValue(false);
    assetSigningService.isEnabled.mockReturnValue(true);

    expect(guard.canActivate()).toBe(true);
  });

  it('should throw 404 when imgproxy is enabled', () => {
    imgproxyService.isEnabled.mockReturnValue(true);
    assetSigningService.isEnabled.mockReturnValue(true);

    try {
      guard.canActivate();
      throw new Error('Expected guard to throw');
    } catch (error: unknown) {
      expect(error).toHaveProperty('status', HttpStatus.NOT_FOUND);
    }
  });

  it('should throw 404 when signing is disabled', () => {
    imgproxyService.isEnabled.mockReturnValue(false);
    assetSigningService.isEnabled.mockReturnValue(false);

    try {
      guard.canActivate();
      throw new Error('Expected guard to throw');
    } catch (error: unknown) {
      expect(error).toHaveProperty('status', HttpStatus.NOT_FOUND);
    }
  });
});
