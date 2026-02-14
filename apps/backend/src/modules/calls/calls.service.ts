import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../config/redis.service';

@Injectable()
export class CallsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async initiateCall(callerId: string, chatId: string, type: 'voice' | 'video') {
    const membership = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId: callerId } },
    });
    if (!membership) throw new ForbiddenException('Not a member of this chat');

    const activeCall = await this.redisService.get(`active_call:${chatId}`);
    if (activeCall) throw new BadRequestException('A call is already active in this chat');

    const call = await this.prisma.call.create({
      data: {
        chatId,
        callerId,
        type,
        status: 'ringing',
        participants: {
          create: { userId: callerId, isVideoEnabled: type === 'video' },
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, displayName: true, avatarUrl: true } },
          },
        },
      },
    });

    await this.redisService.set(`active_call:${chatId}`, call.id, 300);
    return call;
  }

  async acceptCall(callId: string, userId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      include: { participants: true },
    });
    if (!call) throw new NotFoundException('Call not found');

    const membership = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId: call.chatId, userId } },
    });
    if (!membership) throw new ForbiddenException('Not a member of this chat');

    const existingParticipant = call.participants.find((p) => p.userId === userId);
    if (!existingParticipant) {
      await this.prisma.callParticipant.create({
        data: {
          callId,
          userId,
          isVideoEnabled: call.type === 'video',
        },
      });
    }

    await this.prisma.call.update({
      where: { id: callId },
      data: { status: 'connected', startedAt: new Date() },
    });

    return this.getCallById(callId);
  }

  async declineCall(callId: string, userId: string) {
    const call = await this.prisma.call.findUnique({ where: { id: callId } });
    if (!call) throw new NotFoundException('Call not found');

    await this.prisma.call.update({
      where: { id: callId },
      data: { status: 'declined', endedAt: new Date() },
    });

    await this.redisService.del(`active_call:${call.chatId}`);
  }

  async endCall(callId: string, userId: string) {
    const call = await this.prisma.call.findUnique({ where: { id: callId } });
    if (!call) throw new NotFoundException('Call not found');

    const endedAt = new Date();
    const duration = call.startedAt ? Math.floor((endedAt.getTime() - call.startedAt.getTime()) / 1000) : 0;

    await this.prisma.call.update({
      where: { id: callId },
      data: { status: 'ended', endedAt, duration },
    });

    await this.prisma.callParticipant.updateMany({
      where: { callId, leftAt: null },
      data: { leftAt: endedAt },
    });

    await this.redisService.del(`active_call:${call.chatId}`);
  }

  async getCallById(callId: string) {
    return this.prisma.call.findUnique({
      where: { id: callId },
      include: {
        participants: {
          include: {
            user: { select: { id: true, displayName: true, avatarUrl: true } },
          },
        },
      },
    });
  }

  async getCallHistory(userId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const where = {
      participants: { some: { userId } },
    };

    const [items, total] = await Promise.all([
      this.prisma.call.findMany({
        where,
        include: {
          participants: {
            include: {
              user: { select: { id: true, displayName: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.call.count({ where }),
    ]);

    return { items, total, page, pageSize, hasMore: skip + items.length < total };
  }

  getIceServers() {
    return [
      { urls: this.configService.get('STUN_SERVER_URL', 'stun:stun.l.google.com:19302') },
      {
        urls: this.configService.get('TURN_SERVER_URL', ''),
        username: this.configService.get('TURN_USERNAME', ''),
        credential: this.configService.get('TURN_PASSWORD', ''),
      },
    ].filter((s) => s.urls);
  }
}
