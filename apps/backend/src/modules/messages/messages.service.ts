import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../config/redis.service';
import { LIMITS } from '@rakhshan/shared';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async sendMessage(data: {
    chatId: string;
    senderId: string;
    localId: string;
    type: string;
    encryptedContent: string;
    replyToId?: string;
  }) {
    const membership = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId: data.chatId, userId: data.senderId } },
    });
    if (!membership) throw new ForbiddenException('Not a member of this chat');

    const message = await this.prisma.message.create({
      data: {
        localId: data.localId,
        chatId: data.chatId,
        senderId: data.senderId,
        type: data.type as any,
        encryptedContent: data.encryptedContent,
        replyToId: data.replyToId,
      },
      include: {
        sender: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        replyTo: {
          select: {
            id: true,
            encryptedContent: true,
            senderId: true,
            type: true,
            sender: { select: { displayName: true } },
          },
        },
        attachments: true,
        reactions: true,
      },
    });

    await this.prisma.chat.update({
      where: { id: data.chatId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async getChatMessages(chatId: string, userId: string, cursor?: string, pageSize = LIMITS.MESSAGES_PER_PAGE) {
    const membership = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!membership) throw new ForbiddenException('Not a member of this chat');

    const where: any = {
      chatId,
      isDeleted: false,
      NOT: { deletedFor: { some: { userId } } },
    };

    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    const messages = await this.prisma.message.findMany({
      where,
      include: {
        sender: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        replyTo: {
          select: {
            id: true,
            encryptedContent: true,
            senderId: true,
            type: true,
            sender: { select: { displayName: true } },
          },
        },
        attachments: true,
        reactions: {
          include: { user: { select: { id: true, displayName: true } } },
        },
        receipts: {
          select: { userId: true, status: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: pageSize + 1,
    });

    const hasMore = messages.length > pageSize;
    const items = hasMore ? messages.slice(0, pageSize) : messages;
    const nextCursor = hasMore ? items[items.length - 1]!.createdAt.toISOString() : undefined;

    return { items: items.reverse(), hasMore, cursor: nextCursor };
  }

  async editMessage(messageId: string, userId: string, encryptedContent: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== userId) throw new ForbiddenException('Can only edit own messages');

    return this.prisma.message.update({
      where: { id: messageId },
      data: { encryptedContent, isEdited: true },
      include: {
        sender: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        attachments: true,
        reactions: true,
      },
    });
  }

  async deleteMessage(messageId: string, userId: string, forEveryone: boolean) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Message not found');

    if (forEveryone) {
      if (message.senderId !== userId) throw new ForbiddenException('Can only delete own messages for everyone');
      await this.prisma.message.update({
        where: { id: messageId },
        data: { isDeleted: true, encryptedContent: '' },
      });
    } else {
      await this.prisma.messageDeletedFor.upsert({
        where: { messageId_userId: { messageId, userId } },
        create: { messageId, userId },
        update: {},
      });
    }
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');

    return this.prisma.messageReaction.upsert({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
      create: { messageId, userId, emoji },
      update: {},
    });
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    await this.prisma.messageReaction.deleteMany({
      where: { messageId, userId, emoji },
    });
  }

  async markAsDelivered(messageIds: string[], userId: string) {
    for (const messageId of messageIds) {
      await this.prisma.messageReceipt.upsert({
        where: { messageId_userId: { messageId, userId } },
        create: { messageId, userId, status: 'delivered' },
        update: { status: 'delivered' },
      });
    }
  }

  async markAsRead(chatId: string, userId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        chatId,
        senderId: { not: userId },
        receipts: { none: { userId, status: 'read' } },
      },
      select: { id: true },
    });

    for (const msg of messages) {
      await this.prisma.messageReceipt.upsert({
        where: { messageId_userId: { messageId: msg.id, userId } },
        create: { messageId: msg.id, userId, status: 'read' },
        update: { status: 'read' },
      });
    }

    await this.prisma.chatMember.update({
      where: { chatId_userId: { chatId, userId } },
      data: { lastReadAt: new Date() },
    });

    return messages.length;
  }

  async searchMessages(chatId: string, userId: string, query: string, page = 1, pageSize = 20) {
    const membership = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!membership) throw new ForbiddenException('Not a member of this chat');

    const skip = (page - 1) * pageSize;
    const where = {
      chatId,
      isDeleted: false,
      encryptedContent: { contains: query },
      NOT: { deletedFor: { some: { userId } } },
    };

    const [items, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        include: {
          sender: { select: { id: true, displayName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.message.count({ where }),
    ]);

    return { items, total, page, pageSize, hasMore: skip + items.length < total };
  }
}
