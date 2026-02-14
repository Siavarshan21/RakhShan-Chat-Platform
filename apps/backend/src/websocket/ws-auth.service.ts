import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';

export interface WsUser {
  userId: string;
  phoneNumber: string;
  deviceId: string;
}

@Injectable()
export class WsAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async authenticateToken(token: string): Promise<WsUser | null> {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, accountStatus: true },
      });

      if (!user || user.accountStatus !== 'active') return null;

      return {
        userId: payload.sub,
        phoneNumber: payload.phoneNumber,
        deviceId: payload.deviceId,
      };
    } catch {
      return null;
    }
  }
}
