import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/ui';

const { width } = Dimensions.get('window');

interface WelcomeScreenProps {
  navigation: any;
}

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Animated.View entering={FadeInUp.duration(800).delay(200)} style={styles.logoContainer}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}>
            <Text style={[styles.logoText, { color: colors.onPrimary }]}>R</Text>
          </View>
        </Animated.View>

        <Animated.Text
          entering={FadeInUp.duration(800).delay(400)}
          style={[styles.title, { color: colors.text, ...typography.h1 }]}
        >
          Rakhshan Chat
        </Animated.Text>

        <Animated.Text
          entering={FadeInUp.duration(800).delay(600)}
          style={[styles.subtitle, { color: colors.textSecondary, ...typography.body1 }]}
        >
          Secure, fast, and beautifully simple messaging
        </Animated.Text>
      </View>

      <Animated.View entering={FadeInDown.duration(800).delay(800)} style={styles.actions}>
        <Button
          title="Get Started"
          onPress={() => navigation.navigate('PhoneEntry')}
          fullWidth
          size="lg"
        />
        <View style={{ height: spacing.md }} />
        <Button
          title="I already have an account"
          onPress={() => navigation.navigate('PhoneEntry', { isLogin: true })}
          variant="ghost"
          fullWidth
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoContainer: { marginBottom: 32 },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 48, fontWeight: '700' },
  title: { textAlign: 'center', marginBottom: 12 },
  subtitle: { textAlign: 'center', maxWidth: width * 0.7 },
  actions: { paddingBottom: 48 },
});
