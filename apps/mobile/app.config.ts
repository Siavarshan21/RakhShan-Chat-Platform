import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: process.env.APP_NAME || 'Rakhshan Chat',
  slug: 'rakhshan-chat',
  version: process.env.APP_VERSION || '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0A0A0F',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.rakhshan.chat',
    buildNumber: '1',
    infoPlist: {
      NSCameraUsageDescription: 'Rakhshan Chat needs camera access for photos and video calls.',
      NSMicrophoneUsageDescription: 'Rakhshan Chat needs microphone access for voice messages and calls.',
      NSPhotoLibraryUsageDescription: 'Rakhshan Chat needs photo library access to share images.',
      NSContactsUsageDescription: 'Rakhshan Chat can find your friends who use the app.',
    },
    config: {
      usesNonExemptEncryption: true,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0A0A0F',
    },
    package: 'com.rakhshan.chat',
    versionCode: 1,
    permissions: [
      'CAMERA',
      'RECORD_AUDIO',
      'READ_CONTACTS',
      'VIBRATE',
      'RECEIVE_BOOT_COMPLETED',
      'FOREGROUND_SERVICE',
    ],
  },
  plugins: [
    'expo-secure-store',
    'expo-localization',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#6C5CE7',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: 'Allow Rakhshan Chat to access your camera for photos and video calls.',
      },
    ],
  ],
  extra: {
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    wsUrl: process.env.WS_URL || 'ws://localhost:3000',
  },
  scheme: 'rakhshan-chat',
});
