import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/response/AllExceptionsFilter';
import { TransformInterceptor } from './common/response/TransformInterceptor';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Enable CORS (use env or fallback)
  app.enableCors({
    origin: process.env.FRONTEND_URL?.split(',') || 'http://localhost:3001',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // ✅ Global error handler
  app.useGlobalFilters(new AllExceptionsFilter());

  // ✅ Global success response transformer
  app.useGlobalInterceptors(new TransformInterceptor());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 Server running on http://localhost:${port}`);
}
bootstrap();
