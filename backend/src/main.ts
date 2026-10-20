import { NestFactory } from '@nestjs/core';
import { ForbiddenException, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(origin => origin.trim()) });

  // Cookie-authenticated writes must originate from our trusted frontend.
  // Requests using Bearer tokens without session cookies retain their existing API behavior.
  app.use((req: any, _res: any, next: (error?: unknown) => void) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) &&
        req.headers.cookie?.split(';').some((part: string) => part.trim().startsWith('supportapp_session='))) {
      const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(v => v.trim());
      if (!req.headers.origin || !allowedOrigins.includes(req.headers.origin)) {
        return next(new ForbiddenException('Invalid request origin'));
      }
    }
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();