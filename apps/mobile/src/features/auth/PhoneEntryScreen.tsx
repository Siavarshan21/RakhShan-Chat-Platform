import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { Button, Input } from '../../components/ui';
import { useAuthStore } from '../../store';

interface PhoneEntryScreenProps {
  navigation: any;
  route: any;
}

export function PhoneEntryScreen({ navigation, route }: PhoneEntryScreenProps) {
  const { colors, typography, spacing } = useTheme();
  const isLogin = route.params?.isLogin ?? false;
  const [phoneNumber, setPhoneNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const { requestVerification, isLoading, error, clearError } = useAuthStore();

  const handleContinue = async () => {
    clearError();
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    try {
      await requestVerification(formattedPhone);
      navigation.navigate('Verification', {
        phoneNumber: formattedPhone,
        displayName: isLogin ? undefined : displayName,
        isLogin,
      });
    } catch {
      // Error is set in store
    }
  };

  const isValid = phoneNumber.length >= 7 && (isLogin || displayName.length >= 1);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(600)}>
          <Text style={[styles.title, { color: colors.text, ...typography.h2 }]}>
            {isLogin ? 'Welcome back' : 'Create your account'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, ...typography.body2 }]}>
            {isLogin
              ? 'Enter your phone number to sign in'
              : 'Enter your details to get started'}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.form}>
          {!isLogin && (
            <Input
              label="Display Name"
              placeholder="Your name"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          )}
          <Input
            label="Phone Number"
            placeholder="+1 234 567 8900"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
          {error && (
            <Text style={[styles.error, { color: colors.error, ...typography.caption }]}>
              {error}
            </Text>
          )}
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.actions}>
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!isValid}
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
  form: { marginTop: 16 },
  error: { marginTop: -8, marginBottom: 8 },
  actions: { paddingBottom: 48 },
});
