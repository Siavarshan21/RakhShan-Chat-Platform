import { io, Socket } from 'socket.io-client';
import { config } from '../utils/config';
import { secureStorage } from '../utils/storage';
import { WsEventType, TIMEOUTS } from '@rakhshan/shared';

type EventCallback = (data: any) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private listeners = new Map<string, Set<EventCallback>>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private isConnecting = false;

  async connect(): Promise<void> {
    if (this.socket?.connected || this.isConnecting) return;
    this.isConnecting = true;

    try {
      const { accessToken } = await secureStorage.getTokens();
      const deviceId = await secureStorage.getDeviceId();

      if (!accessToken) {
        this.isConnecting = false;
        return;
      }

      this.socket = io(`${config.wsUrl}/chat`, {
        auth: { token: accessToken },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: TIMEOUTS.WS_RECONNECT_BASE_DELAY_MS,
        reconnectionDelayMax: TIMEOUTS.WS_RECONNECT_MAX_DELAY_MS,
        timeout: TIMEOUTS.WS_CONNECTION_TIMEOUT_MS,
        query: { deviceId: deviceId || '' },
      });

      this.setupListeners();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
    }
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.notifyListeners('connect', {});
    });

    this.socket.on('disconnect', (reason) => {
      this.stopHeartbeat();
      this.notifyListeners('disconnect', { reason });
    });

    this.socket.on('connect_error', (error) => {
      this.isConnecting = false;
      this.reconnectAttempts++;
      this.notifyListeners('error', { message: error.message });
    });

    this.socket.on(WsEventType.AUTHENTICATED, (data) => {
      this.notifyListeners(WsEventType.AUTHENTICATED, data);
    });

    this.socket.on(WsEventType.MESSAGE_NEW, (data) => {
      this.notifyListeners(WsEventType.MESSAGE_NEW, data);
    });

    this.socket.on(WsEventType.MESSAGE_DELIVERED, (data) => {
      this.notifyListeners(WsEventType.MESSAGE_DELIVERED, data);
    });

    this.socket.on(WsEventType.MESSAGE_READ, (data) => {
      this.notifyListeners(WsEventType.MESSAGE_READ, data);
    });

    this.socket.on(WsEventType.MESSAGE_EDITED, (data) => {
      this.notifyListeners(WsEventType.MESSAGE_EDITED, data);
    });

    this.socket.on(WsEventType.MESSAGE_DELETED, (data) => {
      this.notifyListeners(WsEventType.MESSAGE_DELETED, data);
    });

    this.socket.on(WsEventType.MESSAGE_REACTION_UPDATE, (data) => {
      this.notifyListeners(WsEventType.MESSAGE_REACTION_UPDATE, data);
    });

    this.socket.on(WsEventType.TYPING_UPDATE, (data) => {
      this.notifyListeners(WsEventType.TYPING_UPDATE, data);
    });

    this.socket.on(WsEventType.PRESENCE_UPDATE, (data) => {
      this.notifyListeners(WsEventType.PRESENCE_UPDATE, data);
    });

    this.socket.on(WsEventType.CALL_INCOMING, (data) => {
      this.notifyListeners(WsEventType.CALL_INCOMING, data);
    });

    this.socket.on(WsEventType.CALL_SIGNAL, (data) => {
      this.notifyListeners(WsEventType.CALL_SIGNAL, data);
    });

    this.socket.on(WsEventType.CALL_STATUS, (data) => {
      this.notifyListeners(WsEventType.CALL_STATUS, data);
    });

    this.socket.on(WsEventType.SYNC_RESPONSE, (data) => {
      this.notifyListeners(WsEventType.SYNC_RESPONSE, data);
    });

    this.socket.on(WsEventType.CHAT_CREATED, (data) => {
      this.notifyListeners(WsEventType.CHAT_CREATED, data);
    });

    this.socket.on(WsEventType.ERROR, (data) => {
      this.notifyListeners(WsEventType.ERROR, data);
    });
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.emit(WsEventType.HEARTBEAT, { timestamp: new Date().toISOString() });
    }, TIMEOUTS.WS_HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  emit(event: string, data: unknown) {
    if (!this.socket?.connected) return;
    this.socket.emit(event, data);
  }

  sendMessage(data: {
    chatId: string;
    localId: string;
    type: string;
    encryptedContent: string;
    replyToId?: string;
  }) {
    this.emit(WsEventType.MESSAGE_SEND, data);
  }

  markAsRead(chatId: string, messageIds: string[]) {
    this.emit(WsEventType.MESSAGE_READ, { chatId, messageIds });
  }

  startTyping(chatId: string) {
    this.emit(WsEventType.TYPING_START, { chatId });
  }

  stopTyping(chatId: string) {
    this.emit(WsEventType.TYPING_STOP, { chatId });
  }

  sendCallSignal(data: { callId: string; toUserId: string; type: string; payload: string }) {
    this.emit(WsEventType.CALL_SIGNAL, data);
  }

  requestSync(lastSyncTimestamp: string, chatIds: string[]) {
    this.emit(WsEventType.SYNC_REQUEST, { lastSyncTimestamp, chatIds });
  }

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  off(event: string, callback: EventCallback) {
    this.listeners.get(event)?.delete(callback);
  }

  private notifyListeners(event: string, data: unknown) {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error(`WebSocket listener error for ${event}:`, err);
      }
    });
  }

  disconnect() {
    this.stopHeartbeat();
    this.socket?.disconnect();
    this.socket = null;
    this.isConnecting = false;
  }

  get connected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const ws = new WebSocketService();
