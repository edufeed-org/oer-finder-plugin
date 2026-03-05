import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('app.nodeEnv', 'development');
  const isProduction = nodeEnv === 'production';

  // Add Helmet for security headers
  app.use(helmet());

  // Configure trust proxy for correct client IP detection behind reverse proxies.
  // Set TRUST_PROXY=1 when behind one proxy (e.g., nginx), =2 for two (e.g., CDN + nginx).
  // Defaults to 0 (disabled) — do NOT enable without a proxy, as clients could spoof their IP.
  const trustProxy = configService.get<number>('app.trustProxy', 0);
  if (trustProxy > 0) {
    app.set('trust proxy', trustProxy);
  }

  // Apply global exception filter to prevent internal error details leaking
  app.useGlobalFilters(new HttpExceptionFilter(nodeEnv));

  // Configure CORS for public read-only API
  const corsOrigins = configService.get<true | Array<string | RegExp>>(
    'app.corsAllowedOrigins',
    true,
  );
  if (isProduction && corsOrigins === true) {
    logger.warn(
      'CORS_ALLOWED_ORIGINS is not set — all origins are allowed. ' +
        'Configure CORS_ALLOWED_ORIGINS for production deployments.',
    );
  }
  app.enableCors({
    origin: corsOrigins,
    credentials: false,
    methods: ['GET', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    maxAge: 3600,
  });

  // Configure OpenAPI/Swagger documentation (disabled in production)
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('OER Proxy API')
      .setDescription(
        'API for querying Open Educational Resources (OER) from configured source adapters',
      )
      .setVersion('1.0')
      .addTag('OER', 'Open Educational Resources query endpoints')
      .addTag('Health', 'Health check endpoints')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }

  const port = configService.get<number>('app.port', 3000);
  await app.listen(port, '0.0.0.0');
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application:', err);
  process.exit(1);
});
