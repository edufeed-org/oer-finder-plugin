import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Add Helmet for security headers
  app.use(helmet());

  // Configure CORS for public read-only API
  app.enableCors({
    origin: configService.get<boolean | string>('app.corsOrigin', true),
    credentials: false,
    methods: ['GET', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    maxAge: 3600,
  });

  // Configure OpenAPI/Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('OER Aggregator API')
    .setDescription(
      'API for querying Open Educational Resources (OER) aggregated from Nostr relays',
    )
    .setVersion('1.0')
    .addTag('OER', 'Open Educational Resources query endpoints')
    .addTag('Health', 'Health check endpoints')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = configService.get<number>('app.port', 3000);
  await app.listen(port, '0.0.0.0');
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
