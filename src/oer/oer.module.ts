import { Module } from '@nestjs/common';
import { OerQueryService } from './services/oer-query.service';
import { ImgproxyService } from './services/imgproxy.service';
import { AssetSigningService } from './services/asset-signing.service';
import { AssetUrlService } from './services/asset-url.service';
import { OerController } from './controllers/oer.controller';
import { AssetProxyController } from './controllers/asset-proxy.controller';
import { AdapterModule } from '../adapter';

@Module({
  imports: [AdapterModule],
  controllers: [OerController, AssetProxyController],
  providers: [
    OerQueryService,
    ImgproxyService,
    AssetSigningService,
    AssetUrlService,
  ],
  exports: [
    OerQueryService,
    ImgproxyService,
    AssetSigningService,
    AssetUrlService,
  ],
})
export class OerModule {}
