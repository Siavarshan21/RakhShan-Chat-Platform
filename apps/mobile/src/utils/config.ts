import Constants from 'expo-constants';

interface AppConfig {
  apiBaseUrl: string;
  wsUrl: string;
  appName: string;
  appVersion: string;
}

const extra = Constants.expoConfig?.extra ?? {};

export const config: AppConfig = {
  apiBaseUrl: extra.apiBaseUrl || 'http://localhost:3000',
  wsUrl: extra.wsUrl || 'ws://localhost:3000',
  appName: Constants.expoConfig?.name || 'Rakhshan Chat',
  appVersion: Constants.expoConfig?.version || '1.0.0',
};
