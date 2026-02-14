import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { Avatar, EmptyState } from '../../components/ui';
import { api } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';

interface CallItem {
  id: string;
  chatId: string;
  type: 'voice' | 'video';
  status: string;
  participants: Array<{
    user: { id: string; displayName: string; avatarUrl: string | null };
  }>;
  duration: number | null;
  createdAt: string;
}

export function CallsListScreen() {
  const { colors, typography } = useTheme();
  const [calls, setCalls] = useState<CallItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCalls = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await api.get<{ items: CallItem[] }>('/calls/history');
      setCalls(result.items);
    } catch {
      // Handle error silently
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return 'No answer';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCallItem = useCallback(
    ({ item, index }: { item: CallItem; index: number }) => {
      const otherParticipant = item.participants[0]?.user;
      const isMissed = item.status === 'missed' || item.status === 'declined';

      return (
        <Animated.View entering={FadeInRight.duration(300).delay(index * 50)}>
          <TouchableOpacity
            style={[styles.callItem, { borderBottomColor: colors.border }]}
            activeOpacity={0.7}
          >
            <Avatar
              uri={otherParticipant?.avatarUrl || null}
              name={otherParticipant?.displayName || 'Unknown'}
              size={48}
            />
            <View style={styles.callInfo}>
              <Text style={[{ color: colors.text, ...typography.subtitle2 }]}>
                {otherParticipant?.displayName || 'Unknown'}
              </Text>
              <View style={styles.callMeta}>
                <Text
                  style={[
                    {
                      color: isMissed ? colors.error : colors.textSecondary,
                      ...typography.caption,
                    },
                  ]}
                >
                  {item.type === 'video' ? '\uD83D\uDCF9' : '\uD83D\uDCDE'}{' '}
                  {isMissed ? 'Missed' : formatDuration(item.duration)}
                </Text>
              </View>
            </View>
            <Text style={[{ color: colors.textTertiary, ...typography.caption }]}>
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [colors, typography],
  );

  if (!isLoading && calls.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState title="No calls yet" subtitle="Your call history will appear here" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={calls}
        renderItem={renderCallItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadCalls} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  callInfo: { flex: 1, marginLeft: 12 },
  callMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
});
