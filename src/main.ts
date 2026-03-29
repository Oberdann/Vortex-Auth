import * as dotenv from 'dotenv';
dotenv.config();

import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import { ValidationPipe } from '@nestjs/common';
import { AxiosErrorInterceptor } from './common/filters/axios-error-interceptor';
import { ExceptionGlobalFilter } from './common/filters/exception-global-filter';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new AxiosErrorInterceptor());
  app.useGlobalFilters(new ExceptionGlobalFilter());

  const config = new DocumentBuilder()
    .setTitle('Vortex Auth')
    .setDescription('Serviço de autenticação para o ecommerce Vortex')
    .setVersion('0.0.1')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('doc', app, document);

  await app.listen(process.env.PORT ?? 3003);
}

void bootstrap();
