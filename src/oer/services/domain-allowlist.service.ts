import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DomainAllowlistService {
  private readonly allowedDomains: ReadonlyArray<string>;

  constructor(private readonly configService: ConfigService) {
    this.allowedDomains = this.configService.get<string[]>(
      'app.assetProxy.allowedDomains',
      [],
    );
  }

  isEnabled(): boolean {
    return this.allowedDomains.length > 0;
  }

  isDomainAllowed(url: string): boolean {
    if (!this.isEnabled()) {
      return true;
    }
    const hostname = this.extractHostname(url);
    if (!hostname) {
      return false;
    }
    return this.allowedDomains.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    );
  }

  private extractHostname(url: string): string | null {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return null;
    }
  }
}
