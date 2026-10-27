import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const port = parseInt(config.get<string>('PORT', '5000'), 10);
  const frontendOrigin = config.get<string>('FRONTEND_ORIGIN', 'http://localhost:3000');

  // CORS configuration
  app.enableCors({
    origin: [frontendOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global REST prefix
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(port);
  logger.log(`=======================================================`);
  logger.log(`  MeetTrack AI Backend running at: http://localhost:${port}`);
  logger.log(`  REST API Base URL:              http://localhost:${port}/api`);
  logger.log(`  Socket.IO Capture Gateway:       ws://localhost:${port}`);
  logger.log(`  Frontend Origin Allowed:         ${frontendOrigin}`);
  logger.log(`=======================================================`);
}

bootstrap();
