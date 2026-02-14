export enum CallType {
  VOICE = 'voice',
  VIDEO = 'video',
}

export enum CallStatus {
  INITIATING = 'initiating',
  RINGING = 'ringing',
  CONNECTED = 'connected',
  ON_HOLD = 'on_hold',
  ENDED = 'ended',
  MISSED = 'missed',
  DECLINED = 'declined',
  FAILED = 'failed',
}

export interface CallParticipant {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isSpeaking: boolean;
  joinedAt: string;
}

export interface Call {
  id: string;
  chatId: string;
  type: CallType;
  status: CallStatus;
  callerId: string;
  participants: CallParticipant[];
  startedAt: string | null;
  endedAt: string | null;
  duration: number | null;
  createdAt: string;
}

export interface CallSignal {
  callId: string;
  fromUserId: string;
  toUserId: string;
  type: 'offer' | 'answer' | 'ice-candidate';
  payload: string;
}

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface CallHistoryItem {
  id: string;
  chatId: string;
  type: CallType;
  status: CallStatus;
  callerName: string;
  callerAvatarUrl: string | null;
  isOutgoing: boolean;
  duration: number | null;
  createdAt: string;
}
