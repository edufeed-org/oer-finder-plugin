import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { ImageUrls } from '../dto/oer-response.dto';

interface ImgproxyConfig {
  baseUrl: string;
  key: string;
  salt: string;
}

@Injectable()
export class ImgproxyService {
  private readonly baseUrl: string;
  private readonly key: string;
  private readonly salt: string;

  constructor(private configService: ConfigService) {
    const imgproxyConfig =
      this.configService.get<ImgproxyConfig>('app.imgproxy');
    this.baseUrl = imgproxyConfig?.baseUrl || '';
    this.key = imgproxyConfig?.key || '';
    this.salt = imgproxyConfig?.salt || '';
  }

  isEnabled(): boolean {
    return this.baseUrl.length > 0;
  }

  private isSecureMode(): boolean {
    return this.key.length > 0 && this.salt.length > 0;
  }

  generateUrls(sourceUrl: string | null | undefined): ImageUrls | null {
    if (!this.isEnabled() || !sourceUrl) {
      return null;
    }

    const encodedUrl = encodeURIComponent(sourceUrl);

    return {
      high: this.buildProxyUrl(encodedUrl, 0),
      medium: this.buildProxyUrl(encodedUrl, 400),
      small: this.buildProxyUrl(encodedUrl, 200),
    };
  }

  private buildProxyUrl(encodedSourceUrl: string, width: number): string {
    // width:0 means no width constraint (original), height:0 means auto-calculate
    const resizeParams = width > 0 ? `rs:fit:${width}:0` : 'rs:fit:0:0';
    const path = `/${resizeParams}/plain/${encodedSourceUrl}`;

    if (this.isSecureMode()) {
      // Signed URL format: {base}/{signature}/{processing_options}/plain/{encoded_source_url}
      const signature = this.generateSignature(path);
      return `${this.baseUrl}/${signature}${path}`;
    } else {
      // Insecure URL format: {base}/insecure/{processing_options}/plain/{encoded_source_url}
      return `${this.baseUrl}/insecure${path}`;
    }
  }

  private generateSignature(path: string): string {
    const keyBin = Buffer.from(this.key, 'hex');
    const saltBin = Buffer.from(this.salt, 'hex');

    const hmac = createHmac('sha256', keyBin);
    hmac.update(saltBin);
    hmac.update(path);

    return hmac.digest('base64url');
  }
}
