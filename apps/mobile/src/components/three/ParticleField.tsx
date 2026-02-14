import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface ParticleFieldProps {
  count?: number;
  maxSize?: number;
  minSize?: number;
}

interface ParticleConfig {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
}

function Particle({ config, color }: { config: ParticleConfig; color: string }) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: config.duration * 0.4, easing: Easing.inOut(Easing.sine) }),
          withTiming(0, { duration: config.duration * 0.6, easing: Easing.inOut(Easing.sine) }),
        ),
        -1,
        false,
      ),
    );

    translateX.value = withDelay(
      config.delay,
      withRepeat(
        withTiming(config.driftX, { duration: config.duration, easing: Easing.inOut(Easing.sine) }),
        -1,
        true,
      ),
    );

    translateY.value = withDelay(
      config.delay,
      withRepeat(
        withTiming(config.driftY, { duration: config.duration * 1.2, easing: Easing.inOut(Easing.sine) }),
        -1,
        true,
      ),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: config.x,
          top: config.y,
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

/**
 * A subtle particle field background effect.
 * Auto-reduces particle count on Android for performance.
 */
export function ParticleField({ count = 20, maxSize = 6, minSize = 2 }: ParticleFieldProps) {
  const { colors } = useTheme();
  const { width, height } = Dimensions.get('window');

  // Reduce particles on lower-end devices
  const particleCount = Platform.OS === 'android' ? Math.floor(count * 0.5) : count;

  const particles = useMemo<ParticleConfig[]>(() => {
    return Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: minSize + Math.random() * (maxSize - minSize),
      delay: Math.random() * 5000,
      duration: 3000 + Math.random() * 4000,
      driftX: (Math.random() - 0.5) * 40,
      driftY: (Math.random() - 0.5) * 40,
    }));
  }, [particleCount, width, height, maxSize, minSize]);

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      {particles.map((config, i) => (
        <Particle key={i} config={config} color={colors.primary} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
});
