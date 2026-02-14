import { create } from 'zustand';
import { localStorage } from '../utils/storage';

interface NotificationSettings {
  pushEnabled: boolean;
  messagePreview: boolean;
  soundEnabled: boolean;
}

interface SettingsState {
  notifications: NotificationSettings;
  isLoading: boolean;

  initialize: () => Promise<void>;
  updateNotifications: (settings: Partial<NotificationSettings>) => Promise<void>;
  togglePush: () => Promise<void>;
  togglePreview: () => Promise<void>;
  toggleSound: () => Promise<void>;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  messagePreview: true,
  soundEnabled: true,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  notifications: DEFAULT_SETTINGS,
  isLoading: true,

  initialize: async () => {
    try {
      const stored = await localStorage.getJson<NotificationSettings>('settings:notifications');
      if (stored) {
        set({ notifications: stored, isLoading: false });
      } else {
        await localStorage.setJson('settings:notifications', DEFAULT_SETTINGS);
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  updateNotifications: async (updates: Partial<NotificationSettings>) => {
    const newSettings = { ...get().notifications, ...updates };
    set({ notifications: newSettings });
    await localStorage.setJson('settings:notifications', newSettings);
  },

  togglePush: async () => {
    const current = get().notifications.pushEnabled;
    await get().updateNotifications({ pushEnabled: !current });
  },

  togglePreview: async () => {
    const current = get().notifications.messagePreview;
    await get().updateNotifications({ messagePreview: !current });
  },

  toggleSound: async () => {
    const current = get().notifications.soundEnabled;
    await get().updateNotifications({ soundEnabled: !current });
  },
}));
