import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../config/redis.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async findById(id: string) {
    const cached = await this.redisService.getJson<any>(`user:${id}`);
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        phoneNumber: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        status: true,
        lastSeenAt: true,
        publicKey: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    await this.redisService.setJson(`user:${id}`, user, 300);
    return user;
  }

  async findByPhone(phoneNumber: string) {
    return this.prisma.user.findUnique({
      where: { phoneNumber },
      select: {
        id: true,
        displayName: true,
        username: true,
        avatarUrl: true,
        status: true,
        lastSeenAt: true,
        publicKey: true,
      },
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        displayName: true,
        username: true,
        avatarUrl: true,
        status: true,
        lastSeenAt: true,
        publicKey: true,
      },
    });
  }

  async updateProfile(userId: string, data: { displayName?: string; username?: string | null; bio?: string | null }) {
    if (data.username) {
      const existing = await this.prisma.user.findFirst({
        where: { username: data.username, NOT: { id: userId } },
      });
      if (existing) throw new ConflictException('Username already taken');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        phoneNumber: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        status: true,
        lastSeenAt: true,
        publicKey: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.redisService.del(`user:${userId}`);
    return user;
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
    await this.redisService.del(`user:${userId}`);
    return user;
  }

  async updateStatus(userId: string, status: 'online' | 'offline' | 'away' | 'dnd') {
    const data: any = { status };
    if (status === 'offline') {
      data.lastSeenAt = new Date();
    }
    await this.prisma.user.update({ where: { id: userId }, data });
    await this.redisService.del(`user:${userId}`);
  }

  async searchUsers(query: string, currentUserId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const where = {
      AND: [
        { id: { not: currentUserId } },
        { accountStatus: 'active' as const },
        {
          OR: [
            { displayName: { contains: query, mode: 'insensitive' as const } },
            { username: { contains: query, mode: 'insensitive' as const } },
            { phoneNumber: { contains: query } },
          ],
        },
      ],
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          displayName: true,
          username: true,
          avatarUrl: true,
          status: true,
          lastSeenAt: true,
        },
        skip,
        take: pageSize,
        orderBy: { displayName: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      hasMore: skip + items.length < total,
    };
  }

  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) throw new ConflictException('Cannot block yourself');
    await this.prisma.blockedUser.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    });
  }

  async unblockUser(blockerId: string, blockedId: string) {
    await this.prisma.blockedUser.deleteMany({
      where: { blockerId, blockedId },
    });
  }

  async getBlockedUsers(userId: string) {
    const blocked = await this.prisma.blockedUser.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });
    return blocked.map((b) => b.blocked);
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const block = await this.prisma.blockedUser.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    return !!block;
  }

  async deleteAccount(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: 'deleted',
        status: 'offline',
        displayName: 'Deleted Account',
        username: null,
        bio: null,
        avatarUrl: null,
        phoneNumber: `deleted_${userId}`,
      },
    });
    await this.prisma.deviceSession.deleteMany({ where: { userId } });
    await this.redisService.del(`user:${userId}`);
  }
}
