export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  VOICE_NOTE = 'voice_note',
  DOCUMENT = 'document',
  LOCATION = 'location',
  CONTACT = 'contact',
  STICKER = 'sticker',
  SYSTEM = 'system',
}

export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export interface MessageAttachment {
  id: string;
  type: MessageType;
  url: string;
  thumbnailUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string;
  width: number | null;
  height: number | null;
  duration: number | null;
  encryptedKey: string;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  createdAt: string;
}

export interface Message {
  id: string;
  localId: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  encryptedContent: string;
  replyToId: string | null;
  forwardedFromId: string | null;
  attachments: MessageAttachment[];
  reactions: MessageReaction[];
  status: MessageStatus;
  isEdited: boolean;
  isDeleted: boolean;
  deletedForUserIds: string[];
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessageDeliveryReceipt {
  messageId: string;
  userId: string;
  status: MessageStatus;
  timestamp: string;
}

export interface TypingIndicator {
  chatId: string;
  userId: string;
  isTyping: boolean;
}
