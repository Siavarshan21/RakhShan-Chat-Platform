import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../config/redis.service';
import { ConfigService } from '@nestjs/config';

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async registerDeviceToken(userId: string, token: string, platform: string, deviceId: string) {
    await this.prisma.deviceToken.upsert({
      where: { token },
      create: { userId, token, platform, deviceId },
      update: { userId, platform, deviceId },
    });
  }

  async unregisterDeviceToken(token: string) {
    await this.prisma.deviceToken.deleteMany({ where: { token } });
  }

  async sendToUser(userId: string, payload: PushPayload) {
    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId },
    });

    for (const deviceToken of tokens) {
      await this.sendPush(deviceToken.token, deviceToken.platform, payload);
    }
  }

  async sendToChat(chatId: string, excludeUserId: string, payload: PushPayload) {
    const members = await this.prisma.chatMember.findMany({
      where: {
        chatId,
        userId: { not: excludeUserId },
        isMuted: false,
      },
      select: { userId: true },
    });

    for (const member of members) {
      await this.sendToUser(member.userId, payload);
    }
  }

  private async sendPush(token: string, platform: string, payload: PushPayload) {
    // Production implementation would use FCM for Android and APNs for iOS
    // This is the integration point for push notification services
    if (this.configService.get('NODE_ENV') === 'development') {
      console.log(`[DEV] Push notification to ${platform} device: ${JSON.stringify(payload)}`);
    }

    if (platform === 'android') {
      await this.sendFcm(token, payload);
    } else if (platform === 'ios') {
      await this.sendApns(token, payload);
    }
  }

  private async sendFcm(_token: string, _payload: PushPayload) {
    // FCM HTTP v1 API integration point
    // Uses FCM_SERVER_KEY from config
  }

  private async sendApns(_token: string, _payload: PushPayload) {
    // APNs HTTP/2 integration point
    // Uses APNS_KEY_ID and APNS_TEAM_ID from config
  }
}
