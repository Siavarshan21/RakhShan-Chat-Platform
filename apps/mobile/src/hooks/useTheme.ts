import { useThemeStore } from '../store/theme.store';
import { typography, spacing, borderRadius } from '../theme';

export function useTheme() {
  const { colors, isDark, mode, setMode } = useThemeStore();

  return {
    colors,
    typography,
    spacing,
    borderRadius,
    isDark,
    mode,
    setMode,
  };
}
