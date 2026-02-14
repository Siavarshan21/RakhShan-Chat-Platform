import { create } from 'zustand';
import { api, ApiError, encryptionApi } from '../services/api';
import { ws } from '../services/websocket';
import { encryption } from '../services/encryption';
import { secureStorage } from '../utils/storage';
import { User, AuthTokens } from '@rakhshan/shared';
import { v4 as uuid } from 'uuid';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  requestVerification: (phoneNumber: string) => Promise<void>;
  register: (phoneNumber: string, displayName: string, code: string) => Promise<void>;
  login: (phoneNumber: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      const { accessToken } = await secureStorage.getTokens();
      if (!accessToken) {
        set({ isLoading: false });
        return;
      }

      const user = await api.get<User>('/users/me');
      set({ user, isAuthenticated: true, isLoading: false });
      await ws.connect();
    } catch {
      await secureStorage.clearTokens();
      set({ isLoading: false });
    }
  },

  requestVerification: async (phoneNumber: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/verify', { phoneNumber });
      set({ isLoading: false });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to send verification code';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  register: async (phoneNumber: string, displayName: string, code: string) => {
    set({ isLoading: true, error: null });
    try {
      let deviceId = await secureStorage.getDeviceId();
      if (!deviceId) {
        deviceId = uuid();
        await secureStorage.setDeviceId(deviceId);
      }

      const keyPair = await encryption.generateKeyPair();

      const result = await api.post<{ user: User; tokens: AuthTokens }>('/auth/register', {
        phoneNumber,
        displayName,
        verificationCode: code,
        publicKey: keyPair.publicKey,
        deviceId,
        deviceName: Device.modelName || 'Unknown Device',
        platform: Platform.OS as 'ios' | 'android',
      });

      await secureStorage.setTokens(result.tokens.accessToken, result.tokens.refreshToken);
      set({ user: result.user, isAuthenticated: true, isLoading: false });
      await ws.connect();

      // Upload pre-keys for E2E encryption (non-blocking)
      encryption.generatePreKeyBundle(100).then((preKeys) => {
        const publicPreKeys = preKeys.map((pk) => ({
          keyId: pk.keyId,
          publicKey: pk.publicKey,
        }));
        encryptionApi.uploadPreKeys(publicPreKeys).catch(() => {
          console.warn('Failed to upload pre-keys, will retry later');
        });
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Registration failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  login: async (phoneNumber: string, code: string) => {
    set({ isLoading: true, error: null });
    try {
      let deviceId = await secureStorage.getDeviceId();
      if (!deviceId) {
        deviceId = uuid();
        await secureStorage.setDeviceId(deviceId);
      }

      const result = await api.post<{ user: User; tokens: AuthTokens }>('/auth/login', {
        phoneNumber,
        verificationCode: code,
        deviceId,
        deviceName: Device.modelName || 'Unknown Device',
        platform: Platform.OS as 'ios' | 'android',
      });

      await secureStorage.setTokens(result.tokens.accessToken, result.tokens.refreshToken);
      set({ user: result.user, isAuthenticated: true, isLoading: false });
      await ws.connect();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Login failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Continue logout even if API call fails
    }
    ws.disconnect();
    await secureStorage.clearTokens();
    await encryption.clearAllSessions();
    set({ user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
