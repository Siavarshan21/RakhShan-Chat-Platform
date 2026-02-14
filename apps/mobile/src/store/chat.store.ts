import { create } from 'zustand';
import { api, encryptionApi } from '../services/api';
import { ws } from '../services/websocket';
import { encryption } from '../services/encryption';
import { ChatListItem, Message, WsEventType, TypingIndicator } from '@rakhshan/shared';
import { v4 as uuid } from 'uuid';

interface ChatState {
  chats: ChatListItem[];
  currentChatId: string | null;
  messages: Map<string, Message[]>;
  decryptedContent: Map<string, string>;
  typingUsers: Map<string, Set<string>>;
  pendingMessages: Map<string, Message>;
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  hasMoreMessages: Map<string, boolean>;

  loadChats: () => Promise<void>;
  loadMessages: (chatId: string, cursor?: string) => Promise<void>;
  sendMessage: (chatId: string, content: string, recipientPublicKey: string, replyToId?: string) => Promise<void>;
  setCurrentChat: (chatId: string | null) => void;
  createPrivateChat: (userId: string) => Promise<string>;
  createGroup: (name: string, memberIds: string[]) => Promise<string>;
  markAsRead: (chatId: string) => void;
  getDecryptedContent: (messageId: string) => string | undefined;

  // WebSocket event handlers
  handleNewMessage: (message: Message) => void;
  handleMessageDelivered: (data: { messageId: string; localId: string; status: string }) => void;
  handleMessageEdited: (message: Message) => void;
  handleMessageDeleted: (data: { messageId: string; chatId: string }) => void;
  handleTypingUpdate: (data: TypingIndicator) => void;
  initializeWsListeners: () => () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  currentChatId: null,
  messages: new Map(),
  decryptedContent: new Map(),
  typingUsers: new Map(),
  pendingMessages: new Map(),
  isLoadingChats: false,
  isLoadingMessages: false,
  hasMoreMessages: new Map(),

  loadChats: async () => {
    set({ isLoadingChats: true });
    try {
      const result = await api.get<{ items: ChatListItem[] }>('/chats');
      set({ chats: result.items, isLoadingChats: false });
    } catch {
      set({ isLoadingChats: false });
    }
  },

  loadMessages: async (chatId: string, cursor?: string) => {
    set({ isLoadingMessages: true });
    try {
      const params: Record<string, string | number | undefined> = { cursor };
      const result = await api.get<{ items: Message[]; hasMore: boolean; cursor?: string }>(
        `/messages/chat/${chatId}`,
        params,
      );

      set((state) => {
        const existing = state.messages.get(chatId) || [];
        const newMessages = cursor ? [...result.items, ...existing] : result.items;
        const updated = new Map(state.messages);
        updated.set(chatId, newMessages);

        const hasMore = new Map(state.hasMoreMessages);
        hasMore.set(chatId, result.hasMore);

        return { messages: updated, isLoadingMessages: false, hasMoreMessages: hasMore };
      });
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (chatId: string, content: string, recipientPublicKey: string, replyToId?: string) => {
    const localId = uuid();

    // Encrypt the message
    const { ciphertext, nonce } = await encryption.encrypt(content, recipientPublicKey);
    const encryptedContent = JSON.stringify({ ciphertext, nonce });

    // Store plaintext for own message
    set((state) => {
      const decrypted = new Map(state.decryptedContent);
      decrypted.set(localId, content);
      return { decryptedContent: decrypted };
    });

    // Optimistic UI update
    const optimisticMessage: Message = {
      id: localId,
      localId,
      chatId,
      senderId: '',
      type: 'text' as any,
      encryptedContent,
      replyToId: replyToId || null,
      forwardedFromId: null,
      attachments: [],
      reactions: [],
      status: 'sending' as any,
      isEdited: false,
      isDeleted: false,
      deletedForUserIds: [],
      expiresAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => {
      const existing = state.messages.get(chatId) || [];
      const updated = new Map(state.messages);
      updated.set(chatId, [...existing, optimisticMessage]);

      const pending = new Map(state.pendingMessages);
      pending.set(localId, optimisticMessage);

      return { messages: updated, pendingMessages: pending };
    });

    // Send via WebSocket
    ws.sendMessage({
      chatId,
      localId,
      type: 'text',
      encryptedContent,
      replyToId,
    });
  },

  setCurrentChat: (chatId: string | null) => {
    set({ currentChatId: chatId });
  },

  createPrivateChat: async (userId: string) => {
    const result = await api.post<{ id: string }>('/chats/private', { userId });
    await get().loadChats();
    return result.id;
  },

  createGroup: async (name: string, memberIds: string[]) => {
    const result = await api.post<{ id: string }>('/chats/group', { name, memberIds });
    await get().loadChats();
    return result.id;
  },

  markAsRead: (chatId: string) => {
    const messages = get().messages.get(chatId) || [];
    const unreadIds = messages.filter((m) => m.status !== 'read').map((m) => m.id);
    if (unreadIds.length > 0) {
      ws.markAsRead(chatId, unreadIds);
    }
  },

  getDecryptedContent: (messageId: string) => {
    return get().decryptedContent.get(messageId);
  },

  handleNewMessage: (message: Message) => {
    // Decrypt message in background (non-blocking)
    (async () => {
      try {
        const encrypted = JSON.parse(message.encryptedContent);
        if (encrypted.ciphertext && encrypted.nonce && message.sender?.publicKey) {
          const plaintext = await encryption.decrypt(
            encrypted.ciphertext,
            encrypted.nonce,
            message.sender.publicKey
          );
          set((state) => {
            const decrypted = new Map(state.decryptedContent);
            decrypted.set(message.id, plaintext);
            return { decryptedContent: decrypted };
          });
        }
      } catch (error) {
        console.warn('Failed to decrypt message:', error);
      }
    })();

    set((state) => {
      const chatId = message.chatId;
      const existing = state.messages.get(chatId) || [];

      // Check for duplicate
      if (existing.some((m) => m.id === message.id)) return state;

      const updated = new Map(state.messages);
      updated.set(chatId, [...existing, message]);

      // Update chat list order
      const chatIndex = state.chats.findIndex((c) => c.id === chatId);
      if (chatIndex >= 0) {
        const chats = [...state.chats];
        const chat = { ...chats[chatIndex]! };
        chat.lastMessage = {
          content: message.encryptedContent,
          senderName: '',
          timestamp: message.createdAt,
          type: message.type,
        };
        if (state.currentChatId !== chatId) {
          chat.unreadCount = (chat.unreadCount || 0) + 1;
        }
        chats.splice(chatIndex, 1);
        chats.unshift(chat);
        return { messages: updated, chats };
      }

      return { messages: updated };
    });
  },

  handleMessageDelivered: (data) => {
    set((state) => {
      const pending = new Map(state.pendingMessages);
      const pendingMsg = pending.get(data.localId);
      if (!pendingMsg) return state;

      pending.delete(data.localId);

      const chatId = pendingMsg.chatId;
      const existing = state.messages.get(chatId) || [];
      const updated = new Map(state.messages);
      updated.set(
        chatId,
        existing.map((m) =>
          m.localId === data.localId ? { ...m, id: data.messageId, status: 'sent' as any } : m,
        ),
      );

      return { messages: updated, pendingMessages: pending };
    });
  },

  handleMessageEdited: (message: Message) => {
    set((state) => {
      const existing = state.messages.get(message.chatId) || [];
      const updated = new Map(state.messages);
      updated.set(
        message.chatId,
        existing.map((m) => (m.id === message.id ? { ...m, ...message } : m)),
      );
      return { messages: updated };
    });
  },

  handleMessageDeleted: (data) => {
    set((state) => {
      const existing = state.messages.get(data.chatId) || [];
      const updated = new Map(state.messages);
      updated.set(
        data.chatId,
        existing.map((m) =>
          m.id === data.messageId ? { ...m, isDeleted: true, encryptedContent: '' } : m,
        ),
      );
      return { messages: updated };
    });
  },

  handleTypingUpdate: (data: TypingIndicator) => {
    set((state) => {
      const typing = new Map(state.typingUsers);
      const chatTyping = new Set(typing.get(data.chatId) || []);

      if (data.isTyping) {
        chatTyping.add(data.userId);
      } else {
        chatTyping.delete(data.userId);
      }

      typing.set(data.chatId, chatTyping);
      return { typingUsers: typing };
    });
  },

  initializeWsListeners: () => {
    const unsubs = [
      ws.on(WsEventType.MESSAGE_NEW, get().handleNewMessage),
      ws.on(WsEventType.MESSAGE_DELIVERED, get().handleMessageDelivered),
      ws.on(WsEventType.MESSAGE_EDITED, get().handleMessageEdited),
      ws.on(WsEventType.MESSAGE_DELETED, get().handleMessageDeleted),
      ws.on(WsEventType.TYPING_UPDATE, get().handleTypingUpdate),
    ];

    return () => unsubs.forEach((unsub) => unsub());
  },
}));
