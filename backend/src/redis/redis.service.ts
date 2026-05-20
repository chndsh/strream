import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);

  onModuleInit() {
    this.client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');

    this.client.on('connect', () => this.logger.log('✅ Redis connected'));
    this.client.on('error', (err) => this.logger.error('❌ Redis error', err));
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  // Room: add user
  async addUserToRoom(roomId: string, userId: string): Promise<void> {
    await this.client.sadd(`room:${roomId}:users`, userId);
    await this.client.set(`room:${roomId}:active`, '1');
    await this.client.set(`user:${userId}:room`, roomId);
  }

  // Room: remove user
  async removeUserFromRoom(roomId: string, userId: string): Promise<void> {
    await this.client.srem(`room:${roomId}:users`, userId);
    await this.client.del(`user:${userId}:room`);

    // if room is empty, mark inactive
    const remaining = await this.client.scard(`room:${roomId}:users`);
    if (remaining === 0) {
      await this.client.del(`room:${roomId}:active`);
    }
  }

  // Room: get all active users
  async getRoomUsers(roomId: string): Promise<string[]> {
    return this.client.smembers(`room:${roomId}:users`);
  }

  // Room: check if active
  async isRoomActive(roomId: string): Promise<boolean> {
    const val = await this.client.get(`room:${roomId}:active`);
    return val === '1';
  }

  // Room: get user count
  async getRoomUserCount(roomId: string): Promise<number> {
    return this.client.scard(`room:${roomId}:users`);
  }

  // User: get current room
  async getUserRoom(userId: string): Promise<string | null> {
    return this.client.get(`user:${userId}:room`);
  }

  // Room: mark ended
  async endRoom(roomId: string): Promise<void> {
    const users = await this.getRoomUsers(roomId);
    for (const userId of users) {
      await this.client.del(`user:${userId}:room`);
    }
    await this.client.del(`room:${roomId}:users`);
    await this.client.del(`room:${roomId}:active`);
  }
}