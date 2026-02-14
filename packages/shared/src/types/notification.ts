export enum NotificationType {
  NEW_MESSAGE = 'new_message',
  INCOMING_CALL = 'incoming_call',
  MISSED_CALL = 'missed_call',
  GROUP_INVITE = 'group_invite',
  MENTION = 'mention',
  REACTION = 'reaction',
  CONTACT_JOINED = 'contact_joined',
}

export interface PushNotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string>;
  chatId?: string;
  messageId?: string;
  callId?: string;
  badge?: number;
  sound?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  showPreview: boolean;
  sound: boolean;
  vibrate: boolean;
  muteUntil: string | null;
  mutedChatIds: string[];
}

export interface DeviceToken {
  token: string;
  platform: 'ios' | 'android';
  deviceId: string;
}
