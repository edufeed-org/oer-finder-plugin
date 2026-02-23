import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ImageUrls } from '../dto/oer-response.dto';
import { ImgproxyService } from './imgproxy.service';
import { AssetSigningService } from './asset-signing.service';

@Injectable()
export class AssetUrlService {
  private readonly logger = new Logger(AssetUrlService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly imgproxyService: ImgproxyService,
    private readonly assetSigningService: AssetSigningService,
    private readonly configService: ConfigService,
  ) {
    const publicBaseUrl: string =
      this.configService.get<string>('app.publicBaseUrl') ?? '';
    const port: number = this.configService.get<number>('app.port') ?? 3000;
    this.baseUrl = publicBaseUrl || `http://localhost:${port}`;

    if (!publicBaseUrl && this.assetSigningService.isEnabled()) {
      this.logger.warn(
        'PUBLIC_BASE_URL is not set; signed asset URLs will use http://localhost fallback',
      );
    }
  }

  resolveAssetUrls(
    adapterImages: ImageUrls | null | undefined,
    sourceUrl: string | null | undefined,
  ): ImageUrls | null {
    if (adapterImages) {
      return this.signAssetUrls(adapterImages);
    }

    if (!sourceUrl) {
      return null;
    }

    if (this.imgproxyService.isEnabled()) {
      return this.imgproxyService.generateUrls(sourceUrl);
    }

    if (this.assetSigningService.isEnabled()) {
      return this.generateSignedAssetUrls(sourceUrl);
    }

    return {
      high: sourceUrl,
      medium: sourceUrl,
      small: sourceUrl,
    };
  }

  private signAssetUrls(urls: ImageUrls): ImageUrls {
    if (!this.assetSigningService.isEnabled()) {
      return urls;
    }

    return {
      high: this.assetSigningService.generateSignedUrl(urls.high, this.baseUrl),
      medium: this.assetSigningService.generateSignedUrl(
        urls.medium,
        this.baseUrl,
      ),
      small: this.assetSigningService.generateSignedUrl(
        urls.small,
        this.baseUrl,
      ),
    };
  }

  private generateSignedAssetUrls(sourceUrl: string): ImageUrls {
    const signedUrl = this.assetSigningService.generateSignedUrl(
      sourceUrl,
      this.baseUrl,
    );
    return {
      high: signedUrl,
      medium: signedUrl,
      small: signedUrl,
    };
  }
}
