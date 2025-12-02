import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SourceAdapter } from '@edufeed-org/oer-adapter-core';

interface AdaptersConfig {
  enabled: string[];
  timeoutMs: number;
}

/**
 * Service that manages the registration and retrieval of source adapters.
 * Adapters are loaded based on the ENABLED_ADAPTERS environment variable.
 */
@Injectable()
export class AdapterRegistryService implements OnModuleInit {
  private readonly logger = new Logger(AdapterRegistryService.name);
  private readonly adapters: Map<string, SourceAdapter> = new Map();
  private readonly enabledAdapterIds: string[];
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    const adaptersConfig =
      this.configService.get<AdaptersConfig>('app.adapters');
    this.enabledAdapterIds = adaptersConfig?.enabled ?? [];
    this.timeoutMs = adaptersConfig?.timeoutMs ?? 3000;
  }

  onModuleInit(): void {
    if (this.enabledAdapterIds.length === 0) {
      this.logger.log('No adapters enabled');
      return;
    }

    this.logger.log(
      `Adapter system initialized with enabled adapters: ${this.enabledAdapterIds.join(', ')}`,
    );
  }

  /**
   * Register an adapter instance.
   * This is called by adapter modules during initialization.
   */
  registerAdapter(adapter: SourceAdapter): void {
    const sourceId: string = adapter.sourceId;
    const sourceName: string = adapter.sourceName;

    if (!this.enabledAdapterIds.includes(sourceId)) {
      this.logger.warn(
        `Adapter "${sourceId}" is not in ENABLED_ADAPTERS, skipping registration`,
      );
      return;
    }

    if (this.adapters.has(sourceId)) {
      this.logger.warn(
        `Adapter "${sourceId}" is already registered, skipping duplicate`,
      );
      return;
    }

    this.adapters.set(sourceId, adapter);
    this.logger.log(`Registered adapter: ${sourceName} (${sourceId})`);
  }

  /**
   * Get all registered adapters.
   */
  getAdapters(): SourceAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get a specific adapter by its source ID.
   */
  getAdapter(sourceId: string): SourceAdapter | undefined {
    return this.adapters.get(sourceId);
  }

  /**
   * Check if any adapters are registered.
   */
  hasAdapters(): boolean {
    return this.adapters.size > 0;
  }

  /**
   * Get the configured timeout for adapter queries in milliseconds.
   */
  getTimeoutMs(): number {
    return this.timeoutMs;
  }

  /**
   * Get the list of enabled adapter IDs from configuration.
   */
  getEnabledAdapterIds(): string[] {
    return this.enabledAdapterIds;
  }
}
