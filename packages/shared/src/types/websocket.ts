import { Message, MessageDeliveryReceipt, TypingIndicator } from './message';
import { UserPresence } from './user';
import { CallSignal } from './call';

export enum WsEventType {
  // Connection
  AUTHENTICATE = 'authenticate',
  AUTHENTICATED = 'authenticated',
  AUTH_ERROR = 'auth_error',
  HEARTBEAT = 'heartbeat',
  HEARTBEAT_ACK = 'heartbeat_ack',

  // Messages
  MESSAGE_SEND = 'message:send',
  MESSAGE_NEW = 'message:new',
  MESSAGE_DELIVERED = 'message:delivered',
  MESSAGE_READ = 'message:read',
  MESSAGE_EDIT = 'message:edit',
  MESSAGE_EDITED = 'message:edited',
  MESSAGE_DELETE = 'message:delete',
  MESSAGE_DELETED = 'message:deleted',
  MESSAGE_REACTION = 'message:reaction',
  MESSAGE_REACTION_UPDATE = 'message:reaction_update',

  // Typing
  TYPING_START = 'typing:start',
  TYPING_STOP = 'typing:stop',
  TYPING_UPDATE = 'typing:update',

  // Presence
  PRESENCE_UPDATE = 'presence:update',
  PRESENCE_SUBSCRIBE = 'presence:subscribe',

  // Calls
  CALL_INITIATE = 'call:initiate',
  CALL_INCOMING = 'call:incoming',
  CALL_ACCEPT = 'call:accept',
  CALL_DECLINE = 'call:decline',
  CALL_END = 'call:end',
  CALL_SIGNAL = 'call:signal',
  CALL_STATUS = 'call:status',

  // Chat
  CHAT_CREATED = 'chat:created',
  CHAT_UPDATED = 'chat:updated',
  CHAT_DELETED = 'chat:deleted',
  CHAT_MEMBER_ADDED = 'chat:member_added',
  CHAT_MEMBER_REMOVED = 'chat:member_removed',

  // Sync
  SYNC_REQUEST = 'sync:request',
  SYNC_RESPONSE = 'sync:response',

  // Error
  ERROR = 'error',
}

export interface WsMessage<T = unknown> {
  event: WsEventType;
  data: T;
  id: string;
  timestamp: string;
}

export interface WsAuthPayload {
  token: string;
  deviceId: string;
}

export interface WsErrorPayload {
  code: string;
  message: string;
}

export interface WsSyncRequest {
  lastSyncTimestamp: string;
  chatIds: string[];
}

export interface WsSyncResponse {
  messages: Message[];
  presenceUpdates: UserPresence[];
  deliveryReceipts: MessageDeliveryReceipt[];
  typingIndicators: TypingIndicator[];
  timestamp: string;
}

export type WsMessagePayload = {
  [WsEventType.AUTHENTICATE]: WsAuthPayload;
  [WsEventType.AUTHENTICATED]: { userId: string };
  [WsEventType.AUTH_ERROR]: WsErrorPayload;
  [WsEventType.HEARTBEAT]: { timestamp: string };
  [WsEventType.HEARTBEAT_ACK]: { timestamp: string };
  [WsEventType.MESSAGE_SEND]: Omit<Message, 'id' | 'status' | 'createdAt' | 'updatedAt'>;
  [WsEventType.MESSAGE_NEW]: Message;
  [WsEventType.MESSAGE_DELIVERED]: MessageDeliveryReceipt;
  [WsEventType.MESSAGE_READ]: MessageDeliveryReceipt;
  [WsEventType.TYPING_UPDATE]: TypingIndicator;
  [WsEventType.PRESENCE_UPDATE]: UserPresence;
  [WsEventType.CALL_SIGNAL]: CallSignal;
  [WsEventType.SYNC_REQUEST]: WsSyncRequest;
  [WsEventType.SYNC_RESPONSE]: WsSyncResponse;
  [WsEventType.ERROR]: WsErrorPayload;
};
