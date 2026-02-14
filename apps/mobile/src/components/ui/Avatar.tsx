import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface AvatarProps {
  uri: string | null;
  name: string;
  size?: number;
  showOnlineIndicator?: boolean;
  isOnline?: boolean;
}

export function Avatar({ uri, name, size = 48, showOnlineIndicator = false, isOnline = false }: AvatarProps) {
  const { colors } = useTheme();
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const fontSize = size * 0.38;
  const indicatorSize = size * 0.28;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary },
          ]}
        >
          <Text style={[styles.initials, { fontSize, color: colors.onPrimary }]}>{initials}</Text>
        </View>
      )}
      {showOnlineIndicator && isOnline && (
        <View
          style={[
            styles.indicator,
            {
              width: indicatorSize,
              height: indicatorSize,
              borderRadius: indicatorSize / 2,
              backgroundColor: colors.success,
              borderColor: colors.background,
              borderWidth: 2,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  image: { resizeMode: 'cover' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontWeight: '600' },
  indicator: { position: 'absolute', bottom: 0, right: 0 },
});
