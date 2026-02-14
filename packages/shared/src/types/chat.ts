import { Message } from './message';
import { UserProfile } from './user';

export enum ChatType {
  PRIVATE = 'private',
  GROUP = 'group',
  CHANNEL = 'channel',
}

export enum ChatMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export interface ChatMember {
  userId: string;
  role: ChatMemberRole;
  joinedAt: string;
  user: UserProfile;
  isMuted: boolean;
  mutedUntil: string | null;
}

export interface Chat {
  id: string;
  type: ChatType;
  name: string | null;
  description: string | null;
  avatarUrl: string | null;
  creatorId: string;
  members: ChatMember[];
  lastMessage: Message | null;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
  isMuted: boolean;
  mutedUntil: string | null;
  encryptionKeyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatListItem {
  id: string;
  type: ChatType;
  name: string;
  avatarUrl: string | null;
  lastMessage: {
    content: string;
    senderName: string;
    timestamp: string;
    type: Message['type'];
  } | null;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
  isMuted: boolean;
  isOnline: boolean;
  lastSeenAt: string | null;
}

export interface ChatSettings {
  chatId: string;
  notifications: boolean;
  disappearingMessages: number | null;
  mediaAutoDownload: {
    photos: boolean;
    videos: boolean;
    documents: boolean;
    voiceMessages: boolean;
  };
}
