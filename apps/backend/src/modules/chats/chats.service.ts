import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../config/redis.service';
import { LIMITS } from '@rakhshan/shared';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ChatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async createPrivateChat(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
      throw new BadRequestException('Cannot create chat with yourself');
    }

    const existingChat = await this.prisma.chat.findFirst({
      where: {
        type: 'private',
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: otherUserId } } },
        ],
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                username: true,
                avatarUrl: true,
                status: true,
                lastSeenAt: true,
                publicKey: true,
              },
            },
          },
        },
      },
    });

    if (existingChat) return existingChat;

    return this.prisma.chat.create({
      data: {
        type: 'private',
        creatorId: userId,
        encryptionKeyId: uuid(),
        members: {
          create: [
            { userId, role: 'member' },
            { userId: otherUserId, role: 'member' },
          ],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                username: true,
                avatarUrl: true,
                status: true,
                lastSeenAt: true,
                publicKey: true,
              },
            },
          },
        },
      },
    });
  }

  async createGroup(userId: string, data: { name: string; description?: string; memberIds: string[] }) {
    if (data.memberIds.length > LIMITS.GROUP_MAX_MEMBERS - 1) {
      throw new BadRequestException(`Group cannot exceed ${LIMITS.GROUP_MAX_MEMBERS} members`);
    }

    const allMemberIds = [userId, ...data.memberIds.filter((id) => id !== userId)];

    return this.prisma.chat.create({
      data: {
        type: 'group',
        name: data.name,
        description: data.description,
        creatorId: userId,
        encryptionKeyId: uuid(),
        members: {
          create: allMemberIds.map((memberId, index) => ({
            userId: memberId,
            role: index === 0 ? 'owner' : ('member' as any),
          })),
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                username: true,
                avatarUrl: true,
                status: true,
                lastSeenAt: true,
                publicKey: true,
              },
            },
          },
        },
      },
    });
  }

  async getUserChats(userId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;

    const memberships = await this.prisma.chatMember.findMany({
      where: { userId },
      include: {
        chat: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    displayName: true,
                    username: true,
                    avatarUrl: true,
                    status: true,
                    lastSeenAt: true,
                    publicKey: true,
                  },
                },
              },
            },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                type: true,
                encryptedContent: true,
                senderId: true,
                createdAt: true,
                sender: { select: { displayName: true } },
              },
            },
          },
        },
      },
      orderBy: { chat: { updatedAt: 'desc' } },
      skip,
      take: pageSize,
    });

    const items = memberships.map((m) => {
      const chat = m.chat;
      const lastMsg = chat.messages[0] || null;
      const unreadCount = 0; // Computed from receipts in production

      return {
        id: chat.id,
        type: chat.type,
        name: chat.name,
        avatarUrl: chat.avatarUrl,
        members: chat.members,
        lastMessage: lastMsg
          ? {
              id: lastMsg.id,
              type: lastMsg.type,
              encryptedContent: lastMsg.encryptedContent,
              senderName: lastMsg.sender.displayName,
              createdAt: lastMsg.createdAt,
            }
          : null,
        unreadCount,
        isPinned: m.isPinned,
        isArchived: m.isArchived,
        isMuted: m.isMuted,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      };
    });

    return { items, page, pageSize, hasMore: items.length === pageSize };
  }

  async getChatById(chatId: string, userId: string) {
    const membership = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!membership) throw new ForbiddenException('Not a member of this chat');

    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                username: true,
                avatarUrl: true,
                status: true,
                lastSeenAt: true,
                publicKey: true,
              },
            },
          },
        },
      },
    });
    if (!chat) throw new NotFoundException('Chat not found');

    return chat;
  }

  async addMembers(chatId: string, userId: string, memberIds: string[]) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { members: true },
    });
    if (!chat) throw new NotFoundException('Chat not found');
    if (chat.type === 'private') throw new BadRequestException('Cannot add members to private chat');

    const userMember = chat.members.find((m) => m.userId === userId);
    if (!userMember || (userMember.role !== 'owner' && userMember.role !== 'admin')) {
      throw new ForbiddenException('Only admins can add members');
    }

    if (chat.members.length + memberIds.length > LIMITS.GROUP_MAX_MEMBERS) {
      throw new BadRequestException('Member limit exceeded');
    }

    await this.prisma.chatMember.createMany({
      data: memberIds.map((memberId) => ({
        chatId,
        userId: memberId,
        role: 'member' as const,
      })),
      skipDuplicates: true,
    });

    return this.getChatById(chatId, userId);
  }

  async removeMember(chatId: string, userId: string, targetUserId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { members: true },
    });
    if (!chat) throw new NotFoundException('Chat not found');

    const userMember = chat.members.find((m) => m.userId === userId);
    if (!userMember) throw new ForbiddenException('Not a member');

    if (userId !== targetUserId) {
      if (userMember.role !== 'owner' && userMember.role !== 'admin') {
        throw new ForbiddenException('Only admins can remove members');
      }
    }

    await this.prisma.chatMember.deleteMany({
      where: { chatId, userId: targetUserId },
    });
  }

  async updateChat(chatId: string, userId: string, data: { name?: string; description?: string }) {
    const membership = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!membership) throw new ForbiddenException('Not a member');
    if (membership.role !== 'owner' && membership.role !== 'admin') {
      throw new ForbiddenException('Only admins can update chat');
    }

    return this.prisma.chat.update({
      where: { id: chatId },
      data,
    });
  }

  async togglePin(chatId: string, userId: string) {
    const membership = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!membership) throw new ForbiddenException('Not a member');

    return this.prisma.chatMember.update({
      where: { chatId_userId: { chatId, userId } },
      data: { isPinned: !membership.isPinned },
    });
  }

  async toggleMute(chatId: string, userId: string, mutedUntil?: Date) {
    const membership = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!membership) throw new ForbiddenException('Not a member');

    return this.prisma.chatMember.update({
      where: { chatId_userId: { chatId, userId } },
      data: {
        isMuted: !membership.isMuted,
        mutedUntil: !membership.isMuted ? mutedUntil : null,
      },
    });
  }

  async toggleArchive(chatId: string, userId: string) {
    const membership = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!membership) throw new ForbiddenException('Not a member');

    return this.prisma.chatMember.update({
      where: { chatId_userId: { chatId, userId } },
      data: { isArchived: !membership.isArchived },
    });
  }

  async deleteChat(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { members: true },
    });
    if (!chat) throw new NotFoundException('Chat not found');

    const userMember = chat.members.find((m) => m.userId === userId);
    if (!userMember) throw new ForbiddenException('Not a member');
    if (chat.type !== 'private' && userMember.role !== 'owner') {
      throw new ForbiddenException('Only the owner can delete this chat');
    }

    await this.prisma.chat.delete({ where: { id: chatId } });
  }

  async isMember(chatId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    return !!member;
  }
}
