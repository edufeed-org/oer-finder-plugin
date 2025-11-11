import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Returns "ok" if the service is running',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    type: String,
    example: 'ok',
  })
  getHealth(): string {
    return this.appService.getHealth();
  }
}
