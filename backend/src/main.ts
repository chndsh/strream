import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Change "origin" to true to allow your local network, phone, and ngrok domains to connect
  app.enableCors({
    origin: true, 
    credentials: true,
  });

  // Keep it listening globally on 0.0.0.0
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}
bootstrap();