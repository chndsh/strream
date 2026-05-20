import { Injectable, OnModuleInit } from '@nestjs/common';
import { StreamClient } from '@stream-io/node-sdk';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class StreamService implements OnModuleInit {
  private client: StreamClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  onModuleInit() {
    this.client = new StreamClient(
      process.env.STREAM_API_KEY!,
      process.env.STREAM_API_SECRET!,
    );
  }

  generateToken(userId: string): string {
    return this.client.generateUserToken({ user_id: userId });
  }

  async upsertUser(streamId: string, name: string) {
    return this.prisma.user.upsert({
      where: { streamId },
      update: { name },
      create: { streamId, name },
    });
  }

  async createRoom(roomId: string, userId: string, userName: string) {
    const user = await this.upsertUser(userId, userName);

    const call = this.client.video.call('default', roomId);
    await call.getOrCreate({
      data: {
        created_by_id: userId,
        members: [{ user_id: userId }],
      },
    });

    const room = await this.prisma.callRoom.upsert({
      where: { streamRoomId: roomId },
      update: { active: true },
      create: { streamRoomId: roomId, createdById: user.id },
    });

    await this.prisma.callParticipant.upsert({
      where: { userId_roomId: { userId: user.id, roomId: room.id } },
      update: { joinedAt: new Date(), leftAt: null },
      create: { userId: user.id, roomId: room.id },
    });

    // Redis
    await this.redis.addUserToRoom(roomId, userId);

    return { roomId, createdBy: userId };
  }

  async joinRoom(roomId: string, userId: string, userName: string) {
    const user = await this.upsertUser(userId, userName);

    const room = await this.prisma.callRoom.findUnique({
      where: { streamRoomId: roomId },
    });

    if (!room) throw new Error(`Room ${roomId} not found`);

    await this.prisma.callParticipant.upsert({
      where: { userId_roomId: { userId: user.id, roomId: room.id } },
      update: { joinedAt: new Date(), leftAt: null },
      create: { userId: user.id, roomId: room.id },
    });

    // Redis
    await this.redis.addUserToRoom(roomId, userId);

    return { roomId, userId };
  }

  async leaveRoom(roomId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { streamId: userId } });
    if (!user) return;

    const room = await this.prisma.callRoom.findUnique({ where: { streamRoomId: roomId } });
    if (!room) return;

    await this.prisma.callParticipant.updateMany({
      where: { userId: user.id, roomId: room.id, leftAt: null },
      data: { leftAt: new Date() },
    });

    // Redis
    await this.redis.removeUserFromRoom(roomId, userId);

    return { roomId, userId };
  }

  async endRoom(roomId: string) {
    const call = this.client.video.call('default', roomId);
    await call.end();

    await this.prisma.callRoom.update({
      where: { streamRoomId: roomId },
      data: { active: false, endedAt: new Date() },
    });

    // Redis
    await this.redis.endRoom(roomId);

    return { roomId, ended: true };
  }

  async getRoomInfo(roomId: string) {
    const room = await this.prisma.callRoom.findUnique({
      where: { streamRoomId: roomId },
      include: {
        participants: {
          include: { user: true },
          where: { leftAt: null },
        },
      },
    });

    const activeUsers = await this.redis.getRoomUsers(roomId);
    const isActive = await this.redis.isRoomActive(roomId);

    return { ...room, activeUsers, isActive };
  }
}