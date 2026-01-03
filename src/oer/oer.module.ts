import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpenEducationalResource } from './entities/open-educational-resource.entity';
import { OerSource } from './entities/oer-source.entity';
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
