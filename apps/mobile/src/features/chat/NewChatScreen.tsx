import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Input, Avatar } from '../../components/ui';
import { api } from '../../services/api';
import { useChatStore } from '../../store';

interface UserResult {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  status: string;
}

interface NewChatScreenProps {
  navigation: any;
}

export function NewChatScreen({ navigation }: NewChatScreenProps) {
  const { colors, typography } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { createPrivateChat } = useChatStore();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await api.get<{ items: UserResult[] }>('/users/search', { q: query });
        setResults(data.items);
      } catch {
        setResults([]);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectUser = useCallback(
    async (userId: string) => {
      try {
        const chatId = await createPrivateChat(userId);
        navigation.replace('ChatRoom', { chatId });
      } catch (err) {
        console.error('Failed to create chat:', err);
      }
    },
    [createPrivateChat, navigation],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search by name, username, or phone"
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.userItem, { borderBottomColor: colors.border }]}
            onPress={() => handleSelectUser(item.id)}
            activeOpacity={0.7}
          >
            <Avatar uri={item.avatarUrl} name={item.displayName} size={44} />
            <View style={styles.userInfo}>
              <Text style={[{ color: colors.text, ...typography.subtitle2 }]}>
                {item.displayName}
              </Text>
              {item.username && (
                <Text style={[{ color: colors.textSecondary, ...typography.caption }]}>
                  @{item.username}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          query.length >= 2 && !isSearching ? (
            <View style={styles.emptyContainer}>
              <Text style={[{ color: colors.textSecondary, ...typography.body2 }]}>
                No users found
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: { paddingHorizontal: 16, paddingTop: 8 },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  userInfo: { marginLeft: 12, flex: 1 },
  emptyContainer: { alignItems: 'center', paddingVertical: 32 },
});
