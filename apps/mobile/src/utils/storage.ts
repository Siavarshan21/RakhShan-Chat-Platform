import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SECURE_KEYS = {
  ACCESS_TOKEN: 'rakhshan_access_token',
  REFRESH_TOKEN: 'rakhshan_refresh_token',
  PRIVATE_KEY: 'rakhshan_private_key',
  DEVICE_ID: 'rakhshan_device_id',
} as const;

export const secureStorage = {
  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },

  async get(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },

  async remove(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },

  async getTokens() {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN),
      SecureStore.getItemAsync(SECURE_KEYS.REFRESH_TOKEN),
    ]);
    return { accessToken, refreshToken };
  },

  async setTokens(accessToken: string, refreshToken: string) {
    await Promise.all([
      SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, accessToken),
      SecureStore.setItemAsync(SECURE_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },

  async clearTokens() {
    await Promise.all([
      SecureStore.deleteItemAsync(SECURE_KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN),
    ]);
  },

  async getPrivateKey(): Promise<string | null> {
    return SecureStore.getItemAsync(SECURE_KEYS.PRIVATE_KEY);
  },

  async setPrivateKey(key: string) {
    await SecureStore.setItemAsync(SECURE_KEYS.PRIVATE_KEY, key);
  },

  async getDeviceId(): Promise<string | null> {
    return SecureStore.getItemAsync(SECURE_KEYS.DEVICE_ID);
  },

  async setDeviceId(id: string) {
    await SecureStore.setItemAsync(SECURE_KEYS.DEVICE_ID, id);
  },
};

export const localStorage = {
  async set(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },

  async get(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  },

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  async setJson<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  async getJson<T>(key: string): Promise<T | null> {
    const value = await AsyncStorage.getItem(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },

  async clear(): Promise<void> {
    await AsyncStorage.clear();
  },
};
