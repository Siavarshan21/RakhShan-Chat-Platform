import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { Avatar, Button, Input } from '../../components/ui';
import { useAuthStore } from '../../store';
import { api } from '../../services/api';

interface ProfileScreenProps {
  navigation: any;
}

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { user, logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put('/users/me', {
        displayName,
        username: username || null,
        bio: bio || null,
      });
      setIsEditing(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile');
    }
    setIsSaving(false);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Animated.View entering={FadeInDown.duration(600)} style={styles.profileSection}>
        <TouchableOpacity style={styles.avatarContainer}>
          <Avatar uri={user?.avatarUrl || null} name={user?.displayName || ''} size={96} />
          <View
            style={[
              styles.editBadge,
              { backgroundColor: colors.primary, borderRadius: borderRadius.full },
            ]}
          >
            <Text style={{ color: colors.onPrimary, fontSize: 12 }}>Edit</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.infoSection}>
        {isEditing ? (
          <>
            <Input label="Display Name" value={displayName} onChangeText={setDisplayName} />
            <Input label="Username" value={username} onChangeText={setUsername} placeholder="Optional" />
            <Input label="Bio" value={bio} onChangeText={setBio} placeholder="Tell people about yourself" multiline />
            <View style={styles.editActions}>
              <Button title="Cancel" onPress={() => setIsEditing(false)} variant="ghost" />
              <Button title="Save" onPress={handleSave} loading={isSaving} />
            </View>
          </>
        ) : (
          <>
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderRadius: borderRadius.lg }]}>
              <InfoRow label="Name" value={user?.displayName || ''} colors={colors} typography={typography} />
              <InfoRow label="Phone" value={user?.phoneNumber || ''} colors={colors} typography={typography} />
              {user?.username && (
                <InfoRow label="Username" value={`@${user.username}`} colors={colors} typography={typography} />
              )}
              {user?.bio && (
                <InfoRow label="Bio" value={user.bio} colors={colors} typography={typography} isLast />
              )}
            </View>
            <Button
              title="Edit Profile"
              onPress={() => setIsEditing(true)}
              variant="outline"
              fullWidth
              style={{ marginTop: spacing.lg }}
            />
          </>
        )}
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.actionsSection}>
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.surface, borderRadius: borderRadius.lg }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={[{ color: colors.text, ...typography.body1 }]}>Settings</Text>
          <Text style={{ color: colors.textTertiary, fontSize: 18 }}>{'\u203A'}</Text>
        </TouchableOpacity>

        <Button
          title="Log Out"
          onPress={handleLogout}
          variant="ghost"
          fullWidth
          textStyle={{ color: colors.error }}
          style={{ marginTop: spacing.xl }}
        />
      </Animated.View>
    </ScrollView>
  );
}

function InfoRow({
  label,
  value,
  colors,
  typography,
  isLast = false,
}: {
  label: string;
  value: string;
  colors: any;
  typography: any;
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        infoStyles.row,
        !isLast && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}
    >
      <Text style={[{ color: colors.textSecondary, ...typography.caption }]}>{label}</Text>
      <Text style={[{ color: colors.text, ...typography.body1, marginTop: 2 }]}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { paddingVertical: 12, paddingHorizontal: 16 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  profileSection: { alignItems: 'center', marginVertical: 24 },
  avatarContainer: { position: 'relative' },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  infoSection: { marginBottom: 24 },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  infoCard: { overflow: 'hidden' },
  actionsSection: {},
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
});
