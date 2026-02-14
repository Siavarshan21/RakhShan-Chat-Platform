import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { Avatar } from '../../components/ui';
import { useChatStore, useAuthStore } from '../../store';
import { ws } from '../../services/websocket';
import { Message as MessageType } from '@rakhshan/shared';
import { TIMEOUTS } from '@rakhshan/shared';
import { formatDistanceToNow } from 'date-fns';

interface ChatRoomScreenProps {
  route: any;
  navigation: any;
}

export function ChatRoomScreen({ route, navigation }: ChatRoomScreenProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { chatId } = route.params;
  const listRef = useRef<FlatList>(null);
  const [inputText, setInputText] = useState('');
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const user = useAuthStore((s) => s.user);
  const {
    messages: allMessages,
    typingUsers,
    isLoadingMessages,
    loadMessages,
    sendMessage,
    setCurrentChat,
    markAsRead,
    hasMoreMessages,
  } = useChatStore();

  const messages = allMessages.get(chatId) || [];
  const chatTypingUsers = typingUsers.get(chatId) || new Set();
  const hasMore = hasMoreMessages.get(chatId) ?? true;

  useEffect(() => {
    setCurrentChat(chatId);
    loadMessages(chatId);
    markAsRead(chatId);

    return () => {
      setCurrentChat(null);
      if (isTypingRef.current) {
        ws.stopTyping(chatId);
      }
    };
  }, [chatId]);

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;
    // For now, use a placeholder public key - in production, fetch from chat members
    sendMessage(chatId, inputText.trim(), '', undefined);
    setInputText('');
    if (isTypingRef.current) {
      ws.stopTyping(chatId);
      isTypingRef.current = false;
    }
  }, [chatId, inputText, sendMessage]);

  const handleTyping = useCallback(
    (text: string) => {
      setInputText(text);

      if (!isTypingRef.current && text.length > 0) {
        ws.startTyping(chatId);
        isTypingRef.current = true;
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          ws.stopTyping(chatId);
          isTypingRef.current = false;
        }
      }, TIMEOUTS.TYPING_INDICATOR_TIMEOUT_MS);
    },
    [chatId],
  );

  const loadEarlierMessages = useCallback(() => {
    if (!hasMore || isLoadingMessages) return;
    const firstMessage = messages[0];
    if (firstMessage) {
      loadMessages(chatId, firstMessage.createdAt);
    }
  }, [chatId, hasMore, isLoadingMessages, messages, loadMessages]);

  const renderMessage = useCallback(
    ({ item }: { item: MessageType }) => {
      const isMine = item.senderId === user?.id;
      const isDeleted = item.isDeleted;

      return (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[
            styles.messageBubble,
            isMine ? styles.myMessage : styles.theirMessage,
            {
              backgroundColor: isMine ? colors.chatBubbleSent : colors.chatBubbleReceived,
              borderRadius: borderRadius.xl,
            },
          ]}
        >
          {isDeleted ? (
            <Text
              style={[
                styles.messageText,
                {
                  color: isMine ? colors.chatBubbleSentText : colors.chatBubbleReceivedText,
                  fontStyle: 'italic',
                  opacity: 0.6,
                  ...typography.body2,
                },
              ]}
            >
              Message deleted
            </Text>
          ) : (
            <>
              <Text
                style={[
                  styles.messageText,
                  {
                    color: isMine ? colors.chatBubbleSentText : colors.chatBubbleReceivedText,
                    ...typography.body2,
                  },
                ]}
              >
                {item.encryptedContent}
              </Text>
              <View style={styles.messageFooter}>
                <Text
                  style={[
                    styles.messageTime,
                    {
                      color: isMine ? colors.chatBubbleSentText : colors.textTertiary,
                      opacity: 0.7,
                      ...typography.caption,
                    },
                  ]}
                >
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </Text>
                {item.isEdited && (
                  <Text
                    style={[
                      styles.editedLabel,
                      {
                        color: isMine ? colors.chatBubbleSentText : colors.textTertiary,
                        opacity: 0.5,
                        ...typography.caption,
                      },
                    ]}
                  >
                    edited
                  </Text>
                )}
                {isMine && (
                  <Text
                    style={[
                      styles.statusIndicator,
                      {
                        color: colors.chatBubbleSentText,
                        opacity: 0.7,
                        ...typography.caption,
                      },
                    ]}
                  >
                    {item.status === 'sending'
                      ? '\u23F3'
                      : item.status === 'sent'
                        ? '\u2713'
                        : item.status === 'delivered'
                          ? '\u2713\u2713'
                          : item.status === 'read'
                            ? '\u2713\u2713'
                            : ''}
                  </Text>
                )}
              </View>
            </>
          )}
        </Animated.View>
      );
    },
    [user, colors, typography, borderRadius],
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <FlatList
        ref={listRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id || item.localId}
        inverted={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesList}
        onEndReachedThreshold={0.3}
        onContentSizeChange={() => {
          if (messages.length > 0) {
            listRef.current?.scrollToEnd({ animated: false });
          }
        }}
        ListHeaderComponent={
          hasMore ? (
            <TouchableOpacity
              onPress={loadEarlierMessages}
              style={styles.loadMore}
              disabled={isLoadingMessages}
            >
              <Text style={{ color: colors.primary, ...typography.body2 }}>
                {isLoadingMessages ? 'Loading...' : 'Load earlier messages'}
              </Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {chatTypingUsers.size > 0 && (
        <Animated.View entering={SlideInDown.duration(200)} style={styles.typingContainer}>
          <Text style={[{ color: colors.textSecondary, ...typography.caption }]}>
            Someone is typing...
          </Text>
        </Animated.View>
      )}

      <Animated.View
        entering={SlideInDown.duration(300)}
        style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
      >
        <View
          style={[
            styles.inputWrapper,
            { backgroundColor: colors.inputBackground, borderRadius: borderRadius.xxl },
          ]}
        >
          <TextInput
            style={[styles.textInput, { color: colors.text, ...typography.body1 }]}
            placeholder="Message"
            placeholderTextColor={colors.textTertiary}
            value={inputText}
            onChangeText={handleTyping}
            multiline
            maxLength={4096}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: inputText.trim() ? colors.primary : colors.inputBackground,
              borderRadius: borderRadius.full,
            },
          ]}
          onPress={handleSend}
          disabled={!inputText.trim()}
          activeOpacity={0.7}
        >
          <Text
            style={{
              color: inputText.trim() ? colors.onPrimary : colors.textTertiary,
              fontSize: 18,
              fontWeight: '600',
            }}
          >
            {'\u2191'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  messagesList: { paddingHorizontal: 12, paddingVertical: 8 },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginVertical: 2,
  },
  myMessage: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirMessage: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  messageText: {},
  messageFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  messageTime: {},
  editedLabel: { marginLeft: 2 },
  statusIndicator: { marginLeft: 2 },
  typingContainer: { paddingHorizontal: 16, paddingVertical: 4 },
  loadMore: { alignItems: 'center', paddingVertical: 12 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrapper: { flex: 1, marginRight: 8, paddingHorizontal: 16, paddingVertical: 4 },
  textInput: { maxHeight: 100, paddingVertical: 8 },
  sendButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
