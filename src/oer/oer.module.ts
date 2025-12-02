import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpenEducationalResource } from './entities/open-educational-resource.entity';
import { OerExtractionService } from './services/oer-extraction.service';
import { OerQueryService } from './services/oer-query.service';
import { ImgproxyService } from './services/imgproxy.service';
import { OerController } from './controllers/oer.controller';
import { NostrModule } from '../nostr/nostr.module';
import { AdapterModule } from '../adapter';

@Module({
  imports: [
    TypeOrmModule.forFeature([OpenEducationalResource]),
    forwardRef(() => NostrModule),
    AdapterModule,
  ],
  controllers: [OerController],
  providers: [OerExtractionService, OerQueryService, ImgproxyService],
  exports: [
    OerExtractionService,
    OerQueryService,
    ImgproxyService,
    TypeOrmModule,
  ],
})
export class OerModule {}
