import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface GlowOrbProps {
  size?: number;
  color?: string;
  intensity?: number;
  position?: { x: number; y: number };
}

/**
 * A subtle, GPU-accelerated glowing orb effect.
 * Uses Reanimated for smooth 60fps animations.
 * Falls back gracefully on low-end devices by reducing opacity.
 */
export function GlowOrb({ size = 200, color, intensity = 0.3, position }: GlowOrbProps) {
  const { colors } = useTheme();
  const orbColor = color || colors.primary;
  const scale = useSharedValue(1);
  const opacity = useSharedValue(intensity);
  const rotate = useSharedValue(0);

  // Reduce effects on Android for perf
  const isLowEnd = Platform.OS === 'android';
  const adjustedIntensity = isLowEnd ? intensity * 0.5 : intensity;

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 4000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.95, { duration: 4000, easing: Easing.inOut(Easing.sine) }),
      ),
      -1,
      true,
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(adjustedIntensity * 1.3, { duration: 3000, easing: Easing.inOut(Easing.sine) }),
        withTiming(adjustedIntensity * 0.7, { duration: 3000, easing: Easing.inOut(Easing.sine) }),
      ),
      -1,
      true,
    );

    if (!isLowEnd) {
      rotate.value = withRepeat(
        withTiming(360, { duration: 20000, easing: Easing.linear }),
        -1,
        false,
      );
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.orb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: orbColor,
          left: position?.x ?? Dimensions.get('window').width / 2 - size / 2,
          top: position?.y ?? 100,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    // GPU-accelerated shadow for glow effect
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 0,
  },
});
