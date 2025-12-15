import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app/app.module';
import * as bodyParser from 'body-parser';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ResponseInterceptor } from './common/interceptor/app.interceptor';
import { AppException } from './common/exception/app.exception';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // enable cors
  app.use(helmet());

  // enable cors

  app.enableCors();

  // compression for responses
  app.use(compression());

  app.use(bodyParser.json({ limit: '5mb' })); // Increase limit
  app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));

  // Api versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      stopAtFirstError: true,
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AppException());

  await app.listen(process.env.APP_PORT ?? 7400);
}
bootstrap();
