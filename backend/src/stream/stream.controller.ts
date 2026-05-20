import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { StreamService } from './stream.service';

@Controller('calls')
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Post('token')
  generateToken(@Body() body: { userId: string }) {
    const token = this.streamService.generateToken(body.userId);
    return { token };
  }

  @Post('create-room')
  createRoom(@Body() body: { roomId: string; userId: string; userName: string }) {
    return this.streamService.createRoom(body.roomId, body.userId, body.userName);
  }

  @Post('join')
  joinRoom(@Body() body: { roomId: string; userId: string; userName: string }) {
    return this.streamService.joinRoom(body.roomId, body.userId, body.userName);
  }

  @Post('leave')
  leaveRoom(@Body() body: { roomId: string; userId: string }) {
    return this.streamService.leaveRoom(body.roomId, body.userId);
  }

  @Post('end')
  endRoom(@Body() body: { roomId: string }) {
    return this.streamService.endRoom(body.roomId);
  }

  @Get('room/:roomId')
  getRoomInfo(@Param('roomId') roomId: string) {
    return this.streamService.getRoomInfo(roomId);
  }
}