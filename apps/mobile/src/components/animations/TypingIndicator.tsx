import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface TypingIndicatorProps {
  size?: number;
}

function Dot({ delay, size, color }: { delay: number; size: number; color: string }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-size * 0.6, { duration: 300 }),
          withTiming(0, { duration: 300 }),
        ),
        -1,
        false,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(1, { duration: 300 }), withTiming(0.4, { duration: 300 })),
        -1,
        false,
      ),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          marginHorizontal: size * 0.2,
        },
        animatedStyle,
      ]}
    />
  );
}

export function TypingIndicator({ size = 8 }: TypingIndicatorProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Dot delay={0} size={size} color={colors.textTertiary} />
      <Dot delay={150} size={size} color={colors.textTertiary} />
      <Dot delay={300} size={size} color={colors.textTertiary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});
