export enum UserStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  AWAY = 'away',
  DO_NOT_DISTURB = 'dnd',
}

export enum AccountStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
  PENDING_VERIFICATION = 'pending_verification',
}

export interface User {
  id: string;
  phoneNumber: string;
  username: string | null;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  accountStatus: AccountStatus;
  lastSeenAt: string | null;
  publicKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  lastSeenAt: string | null;
  publicKey: string;
}

export interface UserPresence {
  userId: string;
  status: UserStatus;
  lastSeenAt: string;
}

export interface ContactInfo {
  userId: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  lastSeenAt: string | null;
  isBlocked: boolean;
  isMuted: boolean;
}
