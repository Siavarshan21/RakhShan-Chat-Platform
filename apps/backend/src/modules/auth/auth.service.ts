import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { EncryptionService } from '../../encryption/encryption.service';
import { RedisService } from '../../config/redis.service';
import { LIMITS } from '@rakhshan/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
    private readonly redisService: RedisService,
  ) {}

  async requestVerification(phoneNumber: string) {
    const rateLimitKey = `otp:ratelimit:${phoneNumber}`;
    const attempts = await this.redisService.incr(rateLimitKey);
    if (attempts === 1) {
      await this.redisService.expire(rateLimitKey, 3600);
    }
    if (attempts > 5) {
      throw new BadRequestException('Too many verification attempts. Try again later.');
    }

    const code = this.encryptionService.generateOtp(LIMITS.OTP_LENGTH);
    const expiresAt = new Date(Date.now() + LIMITS.OTP_EXPIRY_SECONDS * 1000);

    await this.prisma.verificationCode.create({
      data: { phoneNumber, code, expiresAt },
    });

    // In production, send via SMS provider (Twilio, etc.)
    // For development, log the code
    if (this.configService.get('NODE_ENV') === 'development') {
      console.log(`[DEV] Verification code for ${phoneNumber}: ${code}`);
    }

    return {
      requestId: phoneNumber,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async register(data: {
    phoneNumber: string;
    displayName: string;
    verificationCode: string;
    publicKey: string;
    deviceId: string;
    deviceName: string;
    platform: string;
  }) {
    await this.verifyCode(data.phoneNumber, data.verificationCode);

    const existingUser = await this.prisma.user.findUnique({
      where: { phoneNumber: data.phoneNumber },
    });
    if (existingUser) {
      throw new ConflictException('Account already exists. Please login.');
    }

    const user = await this.prisma.user.create({
      data: {
        phoneNumber: data.phoneNumber,
        displayName: data.displayName,
        publicKey: data.publicKey,
        accountStatus: 'active',
        status: 'online',
      },
    });

    const tokens = await this.generateTokens(user.id, data.phoneNumber, data.deviceId);

    await this.prisma.deviceSession.create({
      data: {
        userId: user.id,
        deviceId: data.deviceId,
        deviceName: data.deviceName,
        platform: data.platform,
        refreshToken: this.encryptionService.hashToken(tokens.refreshToken),
      },
    });

    return { user, tokens };
  }

  async login(data: {
    phoneNumber: string;
    verificationCode: string;
    deviceId: string;
    deviceName: string;
    platform: string;
  }) {
    await this.verifyCode(data.phoneNumber, data.verificationCode);

    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: data.phoneNumber },
    });
    if (!user) {
      throw new UnauthorizedException('Account not found. Please register.');
    }
    if (user.accountStatus !== 'active') {
      throw new UnauthorizedException('Account is not active.');
    }

    const tokens = await this.generateTokens(user.id, data.phoneNumber, data.deviceId);

    await this.prisma.deviceSession.upsert({
      where: { userId_deviceId: { userId: user.id, deviceId: data.deviceId } },
      update: {
        deviceName: data.deviceName,
        platform: data.platform,
        refreshToken: this.encryptionService.hashToken(tokens.refreshToken),
        lastActiveAt: new Date(),
      },
      create: {
        userId: user.id,
        deviceId: data.deviceId,
        deviceName: data.deviceName,
        platform: data.platform,
        refreshToken: this.encryptionService.hashToken(tokens.refreshToken),
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { status: 'online', lastSeenAt: new Date() },
    });

    return { user, tokens };
  }

  async refreshTokens(refreshToken: string) {
    let payload: { sub: string; phoneNumber: string; deviceId: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'default-refresh-secret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const hashedToken = this.encryptionService.hashToken(refreshToken);
    const session = await this.prisma.deviceSession.findFirst({
      where: {
        userId: payload.sub,
        deviceId: payload.deviceId,
        refreshToken: hashedToken,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Session not found or token revoked');
    }

    const tokens = await this.generateTokens(payload.sub, payload.phoneNumber, payload.deviceId);

    await this.prisma.deviceSession.update({
      where: { id: session.id },
      data: {
        refreshToken: this.encryptionService.hashToken(tokens.refreshToken),
        lastActiveAt: new Date(),
      },
    });

    return tokens;
  }

  async logout(userId: string, deviceId: string) {
    await this.prisma.deviceSession.deleteMany({
      where: { userId, deviceId },
    });

    const remainingSessions = await this.prisma.deviceSession.count({
      where: { userId },
    });

    if (remainingSessions === 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { status: 'offline', lastSeenAt: new Date() },
      });
    }
  }

  async getDeviceSessions(userId: string) {
    return this.prisma.deviceSession.findMany({
      where: { userId },
      select: {
        id: true,
        deviceId: true,
        deviceName: true,
        platform: true,
        lastActiveAt: true,
        ipAddress: true,
        createdAt: true,
      },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.prisma.deviceSession.deleteMany({
      where: { id: sessionId, userId },
    });
  }

  private async verifyCode(phoneNumber: string, code: string) {
    const verification = await this.prisma.verificationCode.findFirst({
      where: {
        phoneNumber,
        code,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    if (verification.attempts >= 3) {
      throw new BadRequestException('Too many attempts for this code');
    }

    await this.prisma.verificationCode.update({
      where: { id: verification.id },
      data: { isUsed: true },
    });
  }

  private async generateTokens(userId: string, phoneNumber: string, deviceId: string) {
    const payload = { sub: userId, phoneNumber, deviceId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'default-refresh-secret'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
      }),
    ]);

    const decoded = this.jwtService.decode(accessToken) as { exp: number };
    const expiresAt = new Date(decoded.exp * 1000).toISOString();

    return { accessToken, refreshToken, expiresAt };
  }
}
