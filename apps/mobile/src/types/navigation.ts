export type AuthStackParamList = {
  Welcome: undefined;
  PhoneEntry: { isLogin?: boolean } | undefined;
  Verification: {
    phoneNumber: string;
    displayName?: string;
    isLogin: boolean;
  };
};

export type MainStackParamList = {
  Home: undefined;
  ChatRoom: { chatId: string };
  NewChat: undefined;
  Settings: undefined;
};

export type TabParamList = {
  Chats: undefined;
  Calls: undefined;
  Profile: undefined;
};
