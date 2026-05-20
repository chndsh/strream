import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StreamModule } from './stream/stream.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
// import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, RedisModule, StreamModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}