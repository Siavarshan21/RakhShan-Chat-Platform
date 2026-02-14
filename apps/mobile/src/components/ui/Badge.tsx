import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface BadgeProps {
  count: number;
  maxCount?: number;
  size?: 'sm' | 'md';
}

export function Badge({ count, maxCount = 99, size = 'md' }: BadgeProps) {
  const { colors } = useTheme();

  if (count <= 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : String(count);
  const h = size === 'sm' ? 16 : 20;
  const fontSize = size === 'sm' ? 10 : 12;

  return (
    <View
      style={[styles.badge, { backgroundColor: colors.error, minWidth: h, height: h, borderRadius: h / 2 }]}
    >
      <Text style={[styles.text, { fontSize, color: '#FFFFFF' }]}>{displayCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  text: { fontWeight: '700' },
});
