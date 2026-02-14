import { create } from 'zustand';
import { Appearance } from 'react-native';
import { lightTheme, darkTheme, ThemeColors } from '../theme';
import { localStorage } from '../utils/storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;

  initialize: () => Promise<void>;
  setMode: (mode: ThemeMode) => void;
}

function resolveTheme(mode: ThemeMode): { colors: ThemeColors; isDark: boolean } {
  if (mode === 'system') {
    const systemScheme = Appearance.getColorScheme();
    const isDark = systemScheme === 'dark';
    return { colors: isDark ? darkTheme : lightTheme, isDark };
  }
  const isDark = mode === 'dark';
  return { colors: isDark ? darkTheme : lightTheme, isDark };
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  ...resolveTheme('system'),

  initialize: async () => {
    const saved = await localStorage.get('theme_mode');
    const mode = (saved as ThemeMode) || 'system';
    set({ mode, ...resolveTheme(mode) });

    Appearance.addChangeListener(({ colorScheme }) => {
      set((state) => {
        if (state.mode !== 'system') return state;
        const isDark = colorScheme === 'dark';
        return { colors: isDark ? darkTheme : lightTheme, isDark };
      });
    });
  },

  setMode: (mode: ThemeMode) => {
    localStorage.set('theme_mode', mode);
    set({ mode, ...resolveTheme(mode) });
  },
}));
