import React, { forwardRef } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, containerStyle, leftIcon, rightIcon, style, ...props }, ref) => {
    const { colors, borderRadius, spacing, typography } = useTheme();

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text style={[styles.label, { color: colors.textSecondary, ...typography.caption }]}>
            {label}
          </Text>
        )}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.inputBackground,
              borderRadius: borderRadius.lg,
              borderColor: error ? colors.error : 'transparent',
              borderWidth: error ? 1 : 0,
              paddingHorizontal: spacing.lg,
            },
          ]}
        >
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            style={[styles.input, { color: colors.text, ...typography.body1 }, style]}
            placeholderTextColor={colors.textTertiary}
            {...props}
          />
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
        {error && (
          <Text style={[styles.error, { color: colors.error, ...typography.caption }]}>
            {error}
          </Text>
        )}
      </View>
    );
  },
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { marginBottom: 6, marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },
  input: { flex: 1, paddingVertical: 12 },
  leftIcon: { marginRight: 8 },
  rightIcon: { marginLeft: 8 },
  error: { marginTop: 4, marginLeft: 4 },
});
