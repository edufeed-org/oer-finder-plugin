import {
  Injectable,
  CanActivate,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ImgproxyService } from '../services/imgproxy.service';
import { AssetSigningService } from '../services/asset-signing.service';

@Injectable()
export class AssetProxyEnabledGuard implements CanActivate {
  constructor(
    private readonly imgproxyService: ImgproxyService,
    private readonly assetSigningService: AssetSigningService,
  ) {}

  canActivate(): boolean {
    if (
      this.imgproxyService.isEnabled() ||
      !this.assetSigningService.isEnabled()
    ) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
    return true;
  }
}
