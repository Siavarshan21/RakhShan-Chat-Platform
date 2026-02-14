import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { useThemeStore } from '../../store/theme.store';

export function SettingsScreen() {
  const { colors, typography, borderRadius, spacing } = useTheme();
  const { mode, setMode } = useThemeStore();

  const themeOptions: Array<{ label: string; value: 'light' | 'dark' | 'system' }> = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'System', value: 'system' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, ...typography.overline }]}>
          APPEARANCE
        </Text>
        <View style={[styles.section, { backgroundColor: colors.surface, borderRadius: borderRadius.lg }]}>
          {themeOptions.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.settingRow,
                index < themeOptions.length - 1 && {
                  borderBottomColor: colors.border,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                },
              ]}
              onPress={() => setMode(option.value)}
            >
              <Text style={[{ color: colors.text, ...typography.body1 }]}>{option.label}</Text>
              {mode === option.value && (
                <Text style={{ color: colors.primary, fontSize: 16 }}>{'\u2713'}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(100)}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, ...typography.overline }]}>
          NOTIFICATIONS
        </Text>
        <View style={[styles.section, { backgroundColor: colors.surface, borderRadius: borderRadius.lg }]}>
          <View style={styles.settingRow}>
            <Text style={[{ color: colors.text, ...typography.body1 }]}>Push Notifications</Text>
            <Switch
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.onPrimary}
              value={true}
              onValueChange={() => {}}
            />
          </View>
          <View
            style={[
              styles.settingRow,
              { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
            ]}
          >
            <Text style={[{ color: colors.text, ...typography.body1 }]}>Message Preview</Text>
            <Switch
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.onPrimary}
              value={true}
              onValueChange={() => {}}
            />
          </View>
          <View
            style={[
              styles.settingRow,
              { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
            ]}
          >
            <Text style={[{ color: colors.text, ...typography.body1 }]}>Sound</Text>
            <Switch
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.onPrimary}
              value={true}
              onValueChange={() => {}}
            />
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(200)}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, ...typography.overline }]}>
          PRIVACY & SECURITY
        </Text>
        <View style={[styles.section, { backgroundColor: colors.surface, borderRadius: borderRadius.lg }]}>
          <TouchableOpacity style={styles.settingRow}>
            <Text style={[{ color: colors.text, ...typography.body1 }]}>Blocked Users</Text>
            <Text style={{ color: colors.textTertiary, fontSize: 18 }}>{'\u203A'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.settingRow,
              { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
            ]}
          >
            <Text style={[{ color: colors.text, ...typography.body1 }]}>Active Sessions</Text>
            <Text style={{ color: colors.textTertiary, fontSize: 18 }}>{'\u203A'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.settingRow,
              { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
            ]}
          >
            <Text style={[{ color: colors.text, ...typography.body1 }]}>Two-Factor Authentication</Text>
            <Text style={{ color: colors.textTertiary, fontSize: 18 }}>{'\u203A'}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(300)}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, ...typography.overline }]}>
          DATA & STORAGE
        </Text>
        <View style={[styles.section, { backgroundColor: colors.surface, borderRadius: borderRadius.lg }]}>
          <TouchableOpacity style={styles.settingRow}>
            <Text style={[{ color: colors.text, ...typography.body1 }]}>Storage Usage</Text>
            <Text style={{ color: colors.textTertiary, fontSize: 18 }}>{'\u203A'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.settingRow,
              { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
            ]}
          >
            <Text style={[{ color: colors.text, ...typography.body1 }]}>Auto-Download Media</Text>
            <Text style={{ color: colors.textTertiary, fontSize: 18 }}>{'\u203A'}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.footer}>
        <Text style={[{ color: colors.textTertiary, ...typography.caption, textAlign: 'center' }]}>
          Rakhshan Chat v1.0.0
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: { marginTop: 24, marginBottom: 8, marginLeft: 4 },
  section: { overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  footer: { marginTop: 32, marginBottom: 16 },
});
