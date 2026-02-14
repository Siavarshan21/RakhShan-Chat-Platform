import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { Avatar, Badge, EmptyState } from '../../components/ui';
import { useChatStore } from '../../store';
import { formatDistanceToNow } from 'date-fns';

interface ChatListScreenProps {
  navigation: any;
}

export function ChatListScreen({ navigation }: ChatListScreenProps) {
  const { colors, typography, spacing } = useTheme();
  const { chats, isLoadingChats, loadChats } = useChatStore();

  useEffect(() => {
    loadChats();
  }, []);

  const handleChatPress = useCallback(
    (chatId: string) => {
      navigation.navigate('ChatRoom', { chatId });
    },
    [navigation],
  );

  const renderChatItem = useCallback(
    ({ item, index }: { item: (typeof chats)[0]; index: number }) => {
      const lastMessageTime = item.lastMessage?.timestamp
        ? formatDistanceToNow(new Date(item.lastMessage.timestamp), { addSuffix: true })
        : '';

      return (
        <Animated.View entering={FadeInRight.duration(300).delay(index * 50)}>
          <TouchableOpacity
            style={[styles.chatItem, { borderBottomColor: colors.border }]}
            onPress={() => handleChatPress(item.id)}
            activeOpacity={0.7}
          >
            <Avatar
              uri={item.avatarUrl}
              name={item.name}
              size={52}
              showOnlineIndicator
              isOnline={item.isOnline}
            />
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text
                  style={[
                    styles.chatName,
                    { color: colors.text, ...typography.subtitle2 },
                  ]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.timestamp,
                    {
                      color: item.unreadCount > 0 ? colors.primary : colors.textTertiary,
                      ...typography.caption,
                    },
                  ]}
                >
                  {lastMessageTime}
                </Text>
              </View>
              <View style={styles.chatPreview}>
                <Text
                  style={[
                    styles.lastMessage,
                    {
                      color: item.unreadCount > 0 ? colors.text : colors.textSecondary,
                      ...typography.body2,
                      fontWeight: item.unreadCount > 0 ? '500' : '400',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.lastMessage
                    ? `${item.lastMessage.senderName}: ${item.lastMessage.content}`
                    : 'No messages yet'}
                </Text>
                {item.unreadCount > 0 && <Badge count={item.unreadCount} size="sm" />}
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [colors, typography, handleChatPress],
  );

  if (!isLoadingChats && chats.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          title="No conversations yet"
          subtitle="Start a new chat to begin messaging"
          actionLabel="New Chat"
          onAction={() => navigation.navigate('NewChat')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingChats}
            onRefresh={loadChats}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('NewChat')}
        activeOpacity={0.8}
      >
        <Text style={[styles.fabIcon, { color: colors.onPrimary }]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingTop: 8 },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chatInfo: { flex: 1, marginLeft: 12 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName: { flex: 1, marginRight: 8 },
  timestamp: {},
  chatPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  lastMessage: { flex: 1, marginRight: 8 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabIcon: { fontSize: 28, fontWeight: '300' },
});
