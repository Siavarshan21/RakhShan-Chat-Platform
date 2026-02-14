import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { EmptyState } from '../../components/ui';

export function NotificationsScreen() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <EmptyState
        title="No notifications"
        subtitle="You're all caught up!"
      />
    </View>
  );
}
