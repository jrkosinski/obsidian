import { NestFactory } from '@nestjs/core';
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

require('dotenv').config();

async function bootstrap() {
    const logger = new Logger('Bootstrap');

    try {
        const app = await NestFactory.create<NestFastifyApplication>(
            AppModule,
            new FastifyAdapter()
        );

        const port = process.env.PORT || 3090;
        await app.listen(port, '0.0.0.0');
        logger.log(`Application is listening on port ${port}`);
    } catch (error) {
        logger.error('Failed to bootstrap the application', error.stack);
    }
}

bootstrap();
