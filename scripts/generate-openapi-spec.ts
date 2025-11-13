#!/usr/bin/env ts-node
/**
 * Script to generate OpenAPI specification document from NestJS application
 *
 * This script:
 * 1. Bootstraps the NestJS application
 * 2. Generates the OpenAPI document using SwaggerModule
 * 3. Writes the document to a JSON file
 * 4. Does NOT start the HTTP server
 */

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function generateOpenApiSpec() {
  console.log('🔧 Generating OpenAPI specification from NestJS application...');

  // Create NestJS application (without starting HTTP server)
  const app = await NestFactory.create(AppModule, {
    logger: false, // Disable logging during spec generation
  });

  // Configure OpenAPI/Swagger documentation (same config as main.ts)
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

  // Write OpenAPI spec to file
  const outputPath = join(__dirname, '..', 'packages', 'api-client', 'openapi.json');
  writeFileSync(outputPath, JSON.stringify(document, null, 2));

  console.log(`✅ OpenAPI spec generated successfully at: ${outputPath}`);

  // Close the application
  await app.close();
}

generateOpenApiSpec()
  .then(() => {
    console.log('✨ OpenAPI spec generation complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Failed to generate OpenAPI spec:', err);
    process.exit(1);
  });
