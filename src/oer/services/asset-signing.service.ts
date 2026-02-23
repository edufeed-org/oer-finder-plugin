import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

interface AssetSigningConfig {
  key: string;
  ttlSeconds: number;
}

@Injectable()
export class AssetSigningService {
  private readonly keyBuffer: Buffer;
  private readonly ttlSeconds: number;

  constructor(private readonly configService: ConfigService) {
    const config =
      this.configService.get<AssetSigningConfig>('app.assetSigning');
    const key = config?.key ?? '';
    this.keyBuffer =
      key.length >= 32 ? Buffer.from(key, 'utf-8') : Buffer.alloc(0);
    this.ttlSeconds = config?.ttlSeconds ?? 3600;
  }

  isEnabled(): boolean {
    return this.keyBuffer.length >= 32;
  }

  generateSignedPath(sourceUrl: string): string {
    const exp =
      this.ttlSeconds > 0 ? Math.floor(Date.now() / 1000) + this.ttlSeconds : 0;

    const urlEncoded = Buffer.from(sourceUrl).toString('base64url');
    const signature = this.computeSignature(urlEncoded, exp);

    const params = new URLSearchParams({
      url: urlEncoded,
      exp: exp.toString(),
    });

    return `/api/v1/assets/${signature}?${params.toString()}`;
  }

  generateSignedUrl(sourceUrl: string, baseUrl: string): string {
    return `${baseUrl}${this.generateSignedPath(sourceUrl)}`;
  }

  verify(signature: string, urlEncoded: string, exp: number): string | null {
    if (exp > 0) {
      const now = Math.floor(Date.now() / 1000);
      if (now > exp) {
        return null;
      }
    }

    const expectedSignature = this.computeSignature(urlEncoded, exp);

    if (!this.constantTimeEqual(signature, expectedSignature)) {
      return null;
    }

    try {
      return Buffer.from(urlEncoded, 'base64url').toString('utf-8');
    } catch {
      return null;
    }
  }

  private computeSignature(urlEncoded: string, exp: number): string {
    const hmac = createHmac('sha256', this.keyBuffer);
    hmac.update(`${urlEncoded}.${exp}`);
    return hmac.digest('base64url');
  }

  private constantTimeEqual(a: string, b: string): boolean {
    try {
      const bufA = Buffer.from(a, 'base64url');
      const bufB = Buffer.from(b, 'base64url');
      if (bufA.length !== bufB.length) return false;
      return timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }
}
