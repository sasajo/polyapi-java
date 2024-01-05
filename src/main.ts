import { NestFactory } from '@nestjs/core';
import { INestApplication, LogLevel, Logger, ValidationPipe } from '@nestjs/common';
import swStats from 'swagger-stats';
import { AppModule } from 'app.module';
import { PrismaService } from 'prisma-module/prisma.service';
import { ConfigService } from 'config/config.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { API_TAG_INTERNAL } from 'common/constants';
import { Request } from 'express';
import { RedisIoAdapter } from 'event/adapter';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

const logger = new Logger('main');

const initSwagger = (app: INestApplication) => {
  const filterOutPathByTag = (tag: string) => (path: string) => {
    const paths = publicDocument.paths[path];
    publicDocument.paths[path] = Object.keys(paths)
      .filter(method => {
        const pathMethod = paths[method];
        return !pathMethod.tags?.includes(tag);
      })
      .reduce((acc, method) => {
        acc[method] = paths[method];
        return acc;
      }, {});
    return true;
  };

  const internalOptions = new DocumentBuilder()
    .setTitle('Poly Server API (internal)')
    .setDescription('API description')
    .setVersion('1.0')
    .addBearerAuth({ name: 'Authorization', in: 'header', type: 'http', description: 'API Key', scheme: 'bearer' }, 'PolyApiKey')
    .build();
  const internalDocument = SwaggerModule.createDocument(app, internalOptions);
  SwaggerModule.setup('swagger-internal', app, internalDocument);

  const publicOptions = new DocumentBuilder()
    .setTitle('Poly Server API')
    .setDescription('API description')
    .setVersion('1.0')
    .addBearerAuth({ name: 'Authorization', in: 'header', type: 'http', description: 'API Key', scheme: 'bearer' }, 'PolyApiKey')
    .build();
  const publicDocument = SwaggerModule.createDocument(app, publicOptions);
  publicDocument.paths = Object.keys(publicDocument.paths)
    .filter(filterOutPathByTag(API_TAG_INTERNAL))
    .reduce((acc, path) => {
      acc[path] = publicDocument.paths[path];
      return acc;
    }, {});
  SwaggerModule.setup('swagger', app, publicDocument);

  return internalDocument;
};

// eslint-disable-next-line func-style
async function bootstrap() {
  process.on('exit', (code) => {
    console.log('onn exittt: ', code);
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: process.env.LOG_LEVELS
      ? (process.env.LOG_LEVELS.split(',') as LogLevel[])
      : ['log', 'warn', 'error', 'debug'],
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: false,
  }));

  app.useBodyParser('json', { limit: '10mb' });

  const config = app.get(ConfigService);

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  if (config.useSwaggerUI) {
    let internalDocument: any;
    let publicDocument: any;

    if (process.env.NODE_ENV !== 'development') {
      try {
        const [internalDocumentContents, publicDocumentContents] = await Promise.all([readFile(path.join(process.cwd(), './swagger-internal.json'), 'utf-8'), readFile(path.join(process.cwd(), './swagger.json'), 'utf-8')]);

        internalDocument = JSON.parse(internalDocumentContents);
        publicDocument = JSON.parse(publicDocumentContents);

        SwaggerModule.setup('swagger-internal', app, internalDocument);
        SwaggerModule.setup('swagger', app, publicDocument);

        logger.debug('Loaded swagger docs from json files.');
      } catch (err) {
        logger.warn('Could not load swagger docs from json files, loading from app runtime metadata.');
        internalDocument = initSwagger(app);
      }
    } else {
      logger.debug('Loaded swagger docs from app runtime data.');
      internalDocument = initSwagger(app);
    }

    app.use(swStats.getMiddleware({
      swaggerSpec: internalDocument,
      authentication: true,
      onAuthenticate: (req: Request, username: string, password: string) => {
        return username === config.swaggerStatsUsername && password === config.swaggerStatsPassword;
      },
    }));
  }

  const redisIoAdapter = new RedisIoAdapter(app);

  await redisIoAdapter.connectToRedis(config.redisUrl, config.redisPassword);

  app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(config.port);
}

bootstrap()
  .then(() => logger.log('Poly Server is ready!'));
