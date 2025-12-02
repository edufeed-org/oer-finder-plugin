import { Module } from '@nestjs/common';
import { AdapterRegistryService } from './services/adapter-registry.service';
import { AdapterSearchService } from './services/adapter-search.service';
import { AdapterLoaderService } from './services/adapter-loader.service';

@Module({
  providers: [
    AdapterRegistryService,
    AdapterSearchService,
    AdapterLoaderService,
  ],
  exports: [AdapterRegistryService, AdapterSearchService],
})
export class AdapterModule {}
