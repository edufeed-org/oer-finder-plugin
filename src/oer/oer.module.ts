import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpenEducationalResource, OerSource } from '@edufeed-org/oer-entities';
import { OerQueryService } from './services/oer-query.service';
import { ImgproxyService } from './services/imgproxy.service';
import { OerController } from './controllers/oer.controller';
import { NostrModule } from '../nostr/nostr.module';
import { AdapterModule } from '../adapter';

@Module({
  imports: [
    TypeOrmModule.forFeature([OpenEducationalResource, OerSource]),
    NostrModule,
    AdapterModule,
  ],
  controllers: [OerController],
  providers: [OerQueryService, ImgproxyService],
  exports: [NostrModule, OerQueryService, ImgproxyService, TypeOrmModule],
})
export class OerModule {}
