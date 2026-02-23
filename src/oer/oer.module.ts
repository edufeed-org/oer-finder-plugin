import { Module } from '@nestjs/common';
import { OerQueryService } from './services/oer-query.service';
import { ImgproxyService } from './services/imgproxy.service';
import { OerController } from './controllers/oer.controller';
import { AdapterModule } from '../adapter';

@Module({
  imports: [AdapterModule],
  controllers: [OerController],
  providers: [OerQueryService, ImgproxyService],
  exports: [OerQueryService, ImgproxyService],
})
export class OerModule {}
