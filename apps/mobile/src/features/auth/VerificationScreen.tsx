import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/ui';
import { useAuthStore } from '../../store';
import { LIMITS } from '@rakhshan/shared';

interface VerificationScreenProps {
  navigation: any;
  route: any;
}

export function VerificationScreen({ navigation, route }: VerificationScreenProps) {
  const { colors, typography, spacing } = useTheme();
  const { phoneNumber, displayName, isLogin } = route.params;
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(LIMITS.OTP_EXPIRY_SECONDS);
  const inputRef = useRef<TextInput>(null);
  const { login, register, requestVerification, isLoading, error, clearError } = useAuthStore();

  useEffect(() => {
    inputRef.current?.focus();
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVerify = async () => {
    clearError();
    try {
      if (isLogin) {
        await login(phoneNumber, code);
      } else {
        await register(phoneNumber, displayName, code);
      }
    } catch {
      // Error set in store
    }
  };

  const handleResend = async () => {
    clearError();
    try {
      await requestVerification(phoneNumber);
      setCountdown(LIMITS.OTP_EXPIRY_SECONDS);
    } catch {
      // Error set in store
    }
  };

  const codeDigits = Array.from({ length: LIMITS.OTP_LENGTH }, (_, i) => code[i] || '');

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(600)}>
          <Text style={[styles.title, { color: colors.text, ...typography.h2 }]}>
            Verify your number
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, ...typography.body2 }]}>
            Enter the {LIMITS.OTP_LENGTH}-digit code sent to {phoneNumber}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.codeContainer}>
          <View style={styles.codeBoxes}>
            {codeDigits.map((digit, index) => (
              <View
                key={index}
                style={[
                  styles.codeBox,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: digit ? colors.primary : colors.border,
                    borderWidth: digit ? 2 : 1,
                  },
                ]}
              >
                <Text style={[styles.codeDigit, { color: colors.text, ...typography.h2 }]}>
                  {digit}
                </Text>
              </View>
            ))}
          </View>
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={code}
            onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, LIMITS.OTP_LENGTH))}
            keyboardType="number-pad"
            maxLength={LIMITS.OTP_LENGTH}
            autoComplete="sms-otp"
          />
        </Animated.View>

        {error && (
          <Text style={[styles.error, { color: colors.error, ...typography.caption }]}>{error}</Text>
        )}

        <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.resendContainer}>
          {countdown > 0 ? (
            <Text style={[{ color: colors.textSecondary, ...typography.body2 }]}>
              Resend code in {countdown}s
            </Text>
          ) : (
            <Button title="Resend Code" onPress={handleResend} variant="ghost" />
          )}
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.actions}>
        <Button
          title="Verify"
          onPress={handleVerify}
          disabled={code.length !== LIMITS.OTP_LENGTH}
          loading={isLoading}
          fullWidth
          size="lg"
        />
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  content: { flex: 1, justifyContent: 'center' },
  title: { marginBottom: 8 },
  subtitle: { marginBottom: 32 },
  codeContainer: { position: 'relative', marginBottom: 24 },
  codeBoxes: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  codeBox: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeDigit: { textAlign: 'center' },
  hiddenInput: { position: 'absolute', opacity: 0, width: '100%', height: '100%' },
  error: { textAlign: 'center', marginBottom: 16 },
  resendContainer: { alignItems: 'center' },
  actions: { paddingBottom: 48 },
});
