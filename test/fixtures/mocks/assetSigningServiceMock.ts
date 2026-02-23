import type { AssetSigningService } from '../../../src/oer/services/asset-signing.service';

export interface AssetSigningServiceMockConfig {
  isEnabled?: boolean;
}

export function createAssetSigningServiceMock(
  config: AssetSigningServiceMockConfig = {},
): jest.Mocked<AssetSigningService> {
  const { isEnabled = false } = config;
  return {
    isEnabled: jest.fn().mockReturnValue(isEnabled),
    generateSignedPath: jest
      .fn()
      .mockImplementation(
        (url: string) =>
          `/api/v1/assets/mock-sig?url=${Buffer.from(url).toString('base64url')}&exp=0`,
      ),
    generateSignedUrl: jest
      .fn()
      .mockImplementation(
        (url: string, base: string) =>
          `${base}/api/v1/assets/mock-sig?url=${Buffer.from(url).toString('base64url')}&exp=0`,
      ),
    verify: jest.fn().mockReturnValue(null),
  } as unknown as jest.Mocked<AssetSigningService>;
}
