import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

interface AnimatedMessageProps {
  children: React.ReactNode;
  index: number;
  isMine: boolean;
  style?: ViewStyle;
}

export function AnimatedMessage({ children, index, isMine, style }: AnimatedMessageProps) {
  const progress = useSharedValue(0);
  const translateX = useSharedValue(isMine ? 60 : -60);

  useEffect(() => {
    const delay = Math.min(index * 30, 300);

    const timer = setTimeout(() => {
      progress.value = withSpring(1, {
        damping: 18,
        stiffness: 200,
        mass: 0.8,
      });
      translateX.value = withSpring(0, {
        damping: 20,
        stiffness: 180,
      });
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateX: translateX.value },
      {
        scale: interpolate(progress.value, [0, 0.5, 1], [0.85, 1.02, 1], Extrapolation.CLAMP),
      },
    ],
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}
