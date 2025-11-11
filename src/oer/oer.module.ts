import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpenEducationalResource } from './entities/open-educational-resource.entity';
import { OerExtractionService } from './services/oer-extraction.service';
import { OerQueryService } from './services/oer-query.service';
import { OerController } from './controllers/oer.controller';
import { NostrModule } from '../nostr/nostr.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OpenEducationalResource]),
    forwardRef(() => NostrModule),
  ],
  controllers: [OerController],
  providers: [OerExtractionService, OerQueryService],
  exports: [OerExtractionService, OerQueryService, TypeOrmModule],
})
export class OerModule {}
