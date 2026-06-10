import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Preserve raw body ONLY for the Stripe webhook (signature verification),
  // parse JSON normally everywhere else.
  app.use(
    json({
      verify: (req: any, _res, buf) => {
        if (req.originalUrl?.startsWith('/payments/webhook')) {
          req.rawBody = buf;
        }
      },
    }),
  );

  app.enableCors({ origin: process.env.FRONTEND_URL || '*', credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend running on port ${port}`);
}
bootstrap();
