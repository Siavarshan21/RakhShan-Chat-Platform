import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../store';
import { LoadingScreen } from '../components/ui';

import { WelcomeScreen, PhoneEntryScreen, VerificationScreen } from '../features/auth';
import { ChatListScreen, ChatRoomScreen, NewChatScreen } from '../features/chat';
import { CallsListScreen } from '../features/calls';
import { ProfileScreen } from '../features/profile';
import { SettingsScreen } from '../features/settings';

const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused, color }: { label: string; focused: boolean; color: string }) {
  const icons: Record<string, string> = {
    Chats: '\uD83D\uDCAC',
    Calls: '\uD83D\uDCDE',
    Profile: '\uD83D\uDC64',
  };

  return (
    <View style={tabStyles.iconContainer}>
      <Text style={[tabStyles.icon, { opacity: focused ? 1 : 0.5 }]}>{icons[label] || '\u25CF'}</Text>
      <Text style={[tabStyles.label, { color, fontWeight: focused ? '600' : '400' }]}>{label}</Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 4 },
  icon: { fontSize: 22, marginBottom: 2 },
  label: { fontSize: 10 },
});

function HomeTabs() {
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 84,
          paddingBottom: 28,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarShowLabel: false,
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 20 },
      }}
    >
      <Tab.Screen
        name="Chats"
        component={ChatListScreen}
        options={{
          headerTitle: 'Rakhshan Chat',
          tabBarIcon: ({ focused, color }) => <TabIcon label="Chats" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Calls"
        component={CallsListScreen}
        options={{
          tabBarIcon: ({ focused, color }) => <TabIcon label="Calls" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused, color }) => <TabIcon label="Profile" focused={focused} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function AuthNavigator() {
  const { colors } = useTheme();

  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen
        name="PhoneEntry"
        component={PhoneEntryScreen}
        options={{
          headerShown: true,
          headerTitle: '',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <AuthStack.Screen
        name="Verification"
        component={VerificationScreen}
        options={{
          headerShown: true,
          headerTitle: '',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
    </AuthStack.Navigator>
  );
}

function MainNavigator() {
  const { colors } = useTheme();

  return (
    <MainStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        animation: 'slide_from_right',
      }}
    >
      <MainStack.Screen name="Home" component={HomeTabs} options={{ headerShown: false }} />
      <MainStack.Screen
        name="ChatRoom"
        component={ChatRoomScreen}
        options={{
          headerTitle: 'Chat',
          headerBackTitle: 'Back',
        }}
      />
      <MainStack.Screen
        name="NewChat"
        component={NewChatScreen}
        options={{
          headerTitle: 'New Chat',
          presentation: 'modal',
        }}
      />
      <MainStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerTitle: 'Settings',
          headerBackTitle: 'Back',
        }}
      />
    </MainStack.Navigator>
  );
}

export function Navigation() {
  const { colors, isDark } = useTheme();
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen />;
  }

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.error,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
