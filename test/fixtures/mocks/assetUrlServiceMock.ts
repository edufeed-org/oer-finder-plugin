import type { AssetUrlService } from '../../../src/oer/services/asset-url.service';
import type { ImageUrls } from '../../../src/oer/dto/oer-response.dto';

export interface AssetUrlServiceMockConfig {
  resolveResult?: ImageUrls | null;
}

export function createAssetUrlServiceMock(
  config: AssetUrlServiceMockConfig = {},
): jest.Mocked<AssetUrlService> {
  const { resolveResult = null } = config;
  return {
    resolveAssetUrls: jest.fn().mockReturnValue(resolveResult),
  } as unknown as jest.Mocked<AssetUrlService>;
}
