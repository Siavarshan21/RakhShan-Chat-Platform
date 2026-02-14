import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsAuthService } from './ws-auth.service';
import { ConnectionManager } from './connection-manager';
import { PrismaService } from '../database/prisma.service';
import { WsEventType } from '@rakhshan/shared';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/chat',
  transports: ['websocket', 'polling'],
  pingInterval: 30000,
  pingTimeout: 10000,
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly wsAuth: WsAuthService,
    private readonly connectionManager: ConnectionManager,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers.authorization?.replace('Bearer ', '') as string);

      if (!token) {
        client.emit(WsEventType.AUTH_ERROR, { code: 'AUTH_REQUIRED', message: 'Token required' });
        client.disconnect();
        return;
      }

      const user = await this.wsAuth.authenticateToken(token);
      if (!user) {
        client.emit(WsEventType.AUTH_ERROR, { code: 'AUTH_FAILED', message: 'Invalid token' });
        client.disconnect();
        return;
      }

      await this.connectionManager.addClient(client.id, client, user.userId, user.deviceId);

      // Join user's chat rooms
      const memberships = await this.prisma.chatMember.findMany({
        where: { userId: user.userId },
        select: { chatId: true },
      });
      for (const m of memberships) {
        client.join(`chat:${m.chatId}`);
      }
      client.join(`user:${user.userId}`);

      // Update presence
      await this.prisma.user.update({
        where: { id: user.userId },
        data: { status: 'online', lastSeenAt: new Date() },
      });

      // Broadcast presence to contacts
      this.broadcastPresence(user.userId, 'online');

      client.emit(WsEventType.AUTHENTICATED, { userId: user.userId });
      this.logger.log(`Client connected: ${user.userId} (${client.id})`);
    } catch (error) {
      this.logger.error(`Connection error: ${error}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = await this.connectionManager.getUserIdBySocket(client.id);
    await this.connectionManager.removeClient(client.id);

    if (userId && !this.connectionManager.isUserOnline(userId)) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { status: 'offline', lastSeenAt: new Date() },
      });
      this.broadcastPresence(userId, 'offline');
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage(WsEventType.MESSAGE_SEND)
  async handleMessageSend(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      chatId: string;
      localId: string;
      type: string;
      encryptedContent: string;
      replyToId?: string;
    },
  ) {
    const userId = await this.connectionManager.getUserIdBySocket(client.id);
    if (!userId) return;

    try {
      const message = await this.prisma.message.create({
        data: {
          localId: data.localId,
          chatId: data.chatId,
          senderId: userId,
          type: data.type as any,
          encryptedContent: data.encryptedContent,
          replyToId: data.replyToId,
        },
        include: {
          sender: { select: { id: true, displayName: true, avatarUrl: true } },
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

      // Send to all members in the chat room
      this.server.to(`chat:${data.chatId}`).emit(WsEventType.MESSAGE_NEW, message);

      // Send delivery confirmation back to sender
      client.emit(WsEventType.MESSAGE_DELIVERED, {
        messageId: message.id,
        localId: data.localId,
        status: 'sent',
        timestamp: message.createdAt.toISOString(),
      });
    } catch (error) {
      client.emit(WsEventType.ERROR, {
        code: 'MESSAGE_SEND_FAILED',
        message: 'Failed to send message',
      });
    }
  }

  @SubscribeMessage(WsEventType.MESSAGE_READ)
  async handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; messageIds: string[] },
  ) {
    const userId = await this.connectionManager.getUserIdBySocket(client.id);
    if (!userId) return;

    for (const messageId of data.messageIds) {
      await this.prisma.messageReceipt.upsert({
        where: { messageId_userId: { messageId, userId } },
        create: { messageId, userId, status: 'read' },
        update: { status: 'read' },
      });
    }

    await this.prisma.chatMember.update({
      where: { chatId_userId: { chatId: data.chatId, userId } },
      data: { lastReadAt: new Date() },
    });

    this.server.to(`chat:${data.chatId}`).emit(WsEventType.MESSAGE_READ, {
      chatId: data.chatId,
      userId,
      messageIds: data.messageIds,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage(WsEventType.MESSAGE_EDIT)
  async handleMessageEdit(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; encryptedContent: string },
  ) {
    const userId = await this.connectionManager.getUserIdBySocket(client.id);
    if (!userId) return;

    const message = await this.prisma.message.findUnique({ where: { id: data.messageId } });
    if (!message || message.senderId !== userId) return;

    const updated = await this.prisma.message.update({
      where: { id: data.messageId },
      data: { encryptedContent: data.encryptedContent, isEdited: true },
      include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } },
    });

    this.server.to(`chat:${message.chatId}`).emit(WsEventType.MESSAGE_EDITED, updated);
  }

  @SubscribeMessage(WsEventType.MESSAGE_DELETE)
  async handleMessageDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; forEveryone: boolean },
  ) {
    const userId = await this.connectionManager.getUserIdBySocket(client.id);
    if (!userId) return;

    const message = await this.prisma.message.findUnique({ where: { id: data.messageId } });
    if (!message) return;

    if (data.forEveryone && message.senderId === userId) {
      await this.prisma.message.update({
        where: { id: data.messageId },
        data: { isDeleted: true, encryptedContent: '' },
      });
      this.server.to(`chat:${message.chatId}`).emit(WsEventType.MESSAGE_DELETED, {
        messageId: data.messageId,
        chatId: message.chatId,
      });
    } else {
      await this.prisma.messageDeletedFor.upsert({
        where: { messageId_userId: { messageId: data.messageId, userId } },
        create: { messageId: data.messageId, userId },
        update: {},
      });
    }
  }

  @SubscribeMessage(WsEventType.TYPING_START)
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = await this.connectionManager.getUserIdBySocket(client.id);
    if (!userId) return;

    client.to(`chat:${data.chatId}`).emit(WsEventType.TYPING_UPDATE, {
      chatId: data.chatId,
      userId,
      isTyping: true,
    });
  }

  @SubscribeMessage(WsEventType.TYPING_STOP)
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = await this.connectionManager.getUserIdBySocket(client.id);
    if (!userId) return;

    client.to(`chat:${data.chatId}`).emit(WsEventType.TYPING_UPDATE, {
      chatId: data.chatId,
      userId,
      isTyping: false,
    });
  }

  @SubscribeMessage(WsEventType.MESSAGE_REACTION)
  async handleReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; emoji: string; action: 'add' | 'remove' },
  ) {
    const userId = await this.connectionManager.getUserIdBySocket(client.id);
    if (!userId) return;

    const message = await this.prisma.message.findUnique({ where: { id: data.messageId } });
    if (!message) return;

    if (data.action === 'add') {
      await this.prisma.messageReaction.upsert({
        where: { messageId_userId_emoji: { messageId: data.messageId, userId, emoji: data.emoji } },
        create: { messageId: data.messageId, userId, emoji: data.emoji },
        update: {},
      });
    } else {
      await this.prisma.messageReaction.deleteMany({
        where: { messageId: data.messageId, userId, emoji: data.emoji },
      });
    }

    this.server.to(`chat:${message.chatId}`).emit(WsEventType.MESSAGE_REACTION_UPDATE, {
      messageId: data.messageId,
      userId,
      emoji: data.emoji,
      action: data.action,
    });
  }

  @SubscribeMessage(WsEventType.CALL_SIGNAL)
  async handleCallSignal(
    @ConnectedSocket() _client: Socket,
    @MessageBody() data: { callId: string; toUserId: string; type: string; payload: string },
  ) {
    const targetSockets = this.connectionManager.getUserSockets(data.toUserId);
    for (const socket of targetSockets) {
      socket.emit(WsEventType.CALL_SIGNAL, data);
    }
  }

  @SubscribeMessage(WsEventType.SYNC_REQUEST)
  async handleSyncRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { lastSyncTimestamp: string; chatIds: string[] },
  ) {
    const userId = await this.connectionManager.getUserIdBySocket(client.id);
    if (!userId) return;

    const since = new Date(data.lastSyncTimestamp);
    const messages = await this.prisma.message.findMany({
      where: {
        chatId: { in: data.chatIds },
        createdAt: { gt: since },
        isDeleted: false,
      },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } },
        attachments: true,
        reactions: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });

    client.emit(WsEventType.SYNC_RESPONSE, {
      messages,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage(WsEventType.HEARTBEAT)
  handleHeartbeat(@ConnectedSocket() client: Socket) {
    client.emit(WsEventType.HEARTBEAT_ACK, { timestamp: new Date().toISOString() });
  }

  // Helper: emit to specific user across all their devices
  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Helper: emit to all members of a chat
  emitToChat(chatId: string, event: string, data: unknown) {
    this.server.to(`chat:${chatId}`).emit(event, data);
  }

  private async broadcastPresence(userId: string, status: string) {
    const memberships = await this.prisma.chatMember.findMany({
      where: { userId },
      select: { chatId: true },
    });

    for (const m of memberships) {
      this.server.to(`chat:${m.chatId}`).emit(WsEventType.PRESENCE_UPDATE, {
        userId,
        status,
        lastSeenAt: new Date().toISOString(),
      });
    }
  }
}
