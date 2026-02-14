import { Injectable } from '@nestjs/common';
import { RedisService } from '../config/redis.service';
import { Socket } from 'socket.io';

interface ConnectedClient {
  socket: Socket;
  userId: string;
  deviceId: string;
}

@Injectable()
export class ConnectionManager {
  private readonly clients = new Map<string, ConnectedClient>();
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(private readonly redisService: RedisService) {}

  async addClient(socketId: string, socket: Socket, userId: string, deviceId: string) {
    this.clients.set(socketId, { socket, userId, deviceId });

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);

    await this.redisService.sadd(`user:online:${userId}`, socketId);
    await this.redisService.set(`socket:user:${socketId}`, userId, 86400);
  }

  async removeClient(socketId: string) {
    const client = this.clients.get(socketId);
    if (!client) return;

    this.clients.delete(socketId);

    const userSet = this.userSockets.get(client.userId);
    if (userSet) {
      userSet.delete(socketId);
      if (userSet.size === 0) {
        this.userSockets.delete(client.userId);
      }
    }

    await this.redisService.srem(`user:online:${client.userId}`, socketId);
    await this.redisService.del(`socket:user:${socketId}`);
  }

  getClient(socketId: string): ConnectedClient | undefined {
    return this.clients.get(socketId);
  }

  getUserSockets(userId: string): Socket[] {
    const socketIds = this.userSockets.get(userId);
    if (!socketIds) return [];

    return Array.from(socketIds)
      .map((id) => this.clients.get(id)?.socket)
      .filter((s): s is Socket => !!s);
  }

  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return !!sockets && sockets.size > 0;
  }

  async getUserIdBySocket(socketId: string): Promise<string | null> {
    const client = this.clients.get(socketId);
    if (client) return client.userId;
    return this.redisService.get(`socket:user:${socketId}`);
  }

  getOnlineUserCount(): number {
    return this.userSockets.size;
  }

  getConnectionCount(): number {
    return this.clients.size;
  }
}
