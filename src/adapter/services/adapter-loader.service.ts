import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdapterRegistryService } from './adapter-registry.service';
import { createArasaacAdapter } from '@edufeed-org/oer-adapter-arasaac';
import { createOpenverseAdapter } from '@edufeed-org/oer-adapter-openverse';

/**
 * Service responsible for loading and registering adapters based on configuration.
 * This is where new adapters should be added as they are implemented.
 */
@Injectable()
export class AdapterLoaderService implements OnModuleInit {
  private readonly logger = new Logger(AdapterLoaderService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly adapterRegistry: AdapterRegistryService,
  ) {}

  onModuleInit(): void {
    this.loadAdapters();
  }

  private loadAdapters(): void {
    const enabledAdapterIds = this.adapterRegistry.getEnabledAdapterIds();

    if (enabledAdapterIds.length === 0) {
      return;
    }

    this.logger.log(`Enabled adapters: ${enabledAdapterIds.join(', ')}`);

    for (const adapterId of enabledAdapterIds) {
      this.loadAdapter(adapterId);
    }
  }

  private loadAdapter(adapterId: string): void {
    switch (adapterId) {
      case 'arasaac': {
        const adapter = createArasaacAdapter();
        this.adapterRegistry.registerAdapter(adapter);
        break;
      }
      case 'openverse': {
        const adapter = createOpenverseAdapter();
        this.adapterRegistry.registerAdapter(adapter);
        break;
      }
      default:
        this.logger.warn(`Unknown adapter: ${adapterId}`);
    }
  }
}
