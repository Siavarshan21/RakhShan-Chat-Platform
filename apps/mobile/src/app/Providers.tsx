import React, { useEffect, ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

import { useThemeStore } from '../store/theme.store';
import { useAuthStore } from '../store/auth.store';
import { useChatStore } from '../store/chat.store';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const { isDark } = useThemeStore();
  const initialize = useAuthStore((s) => s.initialize);
  const initTheme = useThemeStore((s) => s.initialize);
  const initWsListeners = useChatStore((s) => s.initializeWsListeners);

  useEffect(() => {
    initTheme();
    initialize();
  }, []);

  useEffect(() => {
    const cleanup = initWsListeners();
    return cleanup;
  }, [initWsListeners]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {children}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
