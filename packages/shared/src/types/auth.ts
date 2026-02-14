export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface LoginRequest {
  phoneNumber: string;
  verificationCode: string;
  deviceId: string;
  deviceName: string;
  platform: 'ios' | 'android';
}

export interface RegisterRequest {
  phoneNumber: string;
  displayName: string;
  verificationCode: string;
  publicKey: string;
  deviceId: string;
  deviceName: string;
  platform: 'ios' | 'android';
}

export interface VerificationRequest {
  phoneNumber: string;
}

export interface VerificationResponse {
  requestId: string;
  expiresAt: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface DeviceSession {
  id: string;
  deviceId: string;
  deviceName: string;
  platform: 'ios' | 'android';
  lastActiveAt: string;
  ipAddress: string;
  isCurrent: boolean;
  createdAt: string;
}
