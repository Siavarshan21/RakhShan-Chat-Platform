import { getLocales } from 'expo-localization';

type TranslationKey = keyof typeof en;

const en = {
  // Common
  'common.ok': 'OK',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.done': 'Done',
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.retry': 'Retry',
  'common.search': 'Search',

  // Auth
  'auth.welcome.title': 'Rakhshan Chat',
  'auth.welcome.subtitle': 'Secure, fast, and beautifully simple messaging',
  'auth.welcome.getStarted': 'Get Started',
  'auth.welcome.haveAccount': 'I already have an account',
  'auth.phone.title': 'Enter your phone number',
  'auth.phone.subtitle': "We'll send you a verification code",
  'auth.phone.placeholder': '+1 234 567 8900',
  'auth.phone.continue': 'Continue',
  'auth.verify.title': 'Verify your number',
  'auth.verify.subtitle': 'Enter the code sent to',
  'auth.verify.resend': 'Resend Code',
  'auth.verify.resendIn': 'Resend code in',
  'auth.name.label': 'Display Name',
  'auth.name.placeholder': 'Your name',
  'auth.logout': 'Log Out',
  'auth.logout.confirm': 'Are you sure you want to log out?',

  // Chats
  'chats.title': 'Chats',
  'chats.empty': 'No conversations yet',
  'chats.empty.subtitle': 'Start a new chat to begin messaging',
  'chats.new': 'New Chat',
  'chats.search.placeholder': 'Search conversations',
  'chats.typing': 'typing...',
  'chats.message.deleted': 'Message deleted',
  'chats.message.photo': 'Photo',
  'chats.message.video': 'Video',
  'chats.message.voice': 'Voice message',
  'chats.message.document': 'Document',
  'chats.message.placeholder': 'Message',

  // Calls
  'calls.title': 'Calls',
  'calls.empty': 'No calls yet',
  'calls.missed': 'Missed',
  'calls.incoming': 'Incoming',
  'calls.outgoing': 'Outgoing',

  // Profile
  'profile.title': 'Profile',
  'profile.edit': 'Edit Profile',
  'profile.name': 'Name',
  'profile.username': 'Username',
  'profile.bio': 'Bio',
  'profile.phone': 'Phone',

  // Settings
  'settings.title': 'Settings',
  'settings.appearance': 'Appearance',
  'settings.notifications': 'Notifications',
  'settings.privacy': 'Privacy & Security',
  'settings.storage': 'Data & Storage',
  'settings.theme.light': 'Light',
  'settings.theme.dark': 'Dark',
  'settings.theme.system': 'System',
} as const;

const fa: Record<TranslationKey, string> = {
  'common.ok': '\u062A\u0627\u06CC\u06CC\u062F',
  'common.cancel': '\u0644\u063A\u0648',
  'common.save': '\u0630\u062E\u06CC\u0631\u0647',
  'common.delete': '\u062D\u0630\u0641',
  'common.edit': '\u0648\u06CC\u0631\u0627\u06CC\u0634',
  'common.done': '\u0627\u0646\u062C\u0627\u0645 \u0634\u062F',
  'common.loading': '\u062F\u0631 \u062D\u0627\u0644 \u0628\u0627\u0631\u06AF\u0630\u0627\u0631\u06CC...',
  'common.error': '\u062E\u0637\u0627',
  'common.retry': '\u062A\u0644\u0627\u0634 \u0645\u062C\u062F\u062F',
  'common.search': '\u062C\u0633\u062A\u062C\u0648',
  'auth.welcome.title': '\u0631\u062E\u0634\u0627\u0646 \u0686\u062A',
  'auth.welcome.subtitle': '\u067E\u06CC\u0627\u0645\u200C\u0631\u0633\u0627\u0646\u06CC \u0627\u0645\u0646\u060C \u0633\u0631\u06CC\u0639 \u0648 \u0632\u06CC\u0628\u0627',
  'auth.welcome.getStarted': '\u0634\u0631\u0648\u0639',
  'auth.welcome.haveAccount': '\u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631\u06CC \u062F\u0627\u0631\u0645',
  'auth.phone.title': '\u0634\u0645\u0627\u0631\u0647 \u062A\u0644\u0641\u0646 \u062E\u0648\u062F \u0631\u0627 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u062F',
  'auth.phone.subtitle': '\u06CC\u06A9 \u06A9\u062F \u062A\u0627\u06CC\u06CC\u062F \u0628\u0631\u0627\u06CC \u0634\u0645\u0627 \u0627\u0631\u0633\u0627\u0644 \u0645\u06CC\u200C\u06A9\u0646\u06CC\u0645',
  'auth.phone.placeholder': '+98 912 345 6789',
  'auth.phone.continue': '\u0627\u062F\u0627\u0645\u0647',
  'auth.verify.title': '\u0634\u0645\u0627\u0631\u0647 \u062E\u0648\u062F \u0631\u0627 \u062A\u0627\u06CC\u06CC\u062F \u06A9\u0646\u06CC\u062F',
  'auth.verify.subtitle': '\u06A9\u062F \u0627\u0631\u0633\u0627\u0644 \u0634\u062F\u0647 \u0628\u0647',
  'auth.verify.resend': '\u0627\u0631\u0633\u0627\u0644 \u0645\u062C\u062F\u062F',
  'auth.verify.resendIn': '\u0627\u0631\u0633\u0627\u0644 \u0645\u062C\u062F\u062F \u062F\u0631',
  'auth.name.label': '\u0646\u0627\u0645 \u0646\u0645\u0627\u06CC\u0634\u06CC',
  'auth.name.placeholder': '\u0646\u0627\u0645 \u0634\u0645\u0627',
  'auth.logout': '\u062E\u0631\u0648\u062C',
  'auth.logout.confirm': '\u0622\u06CC\u0627 \u0645\u0637\u0645\u0626\u0646 \u0647\u0633\u062A\u06CC\u062F\u061F',
  'chats.title': '\u0686\u062A\u200C\u0647\u0627',
  'chats.empty': '\u0647\u0646\u0648\u0632 \u0645\u06A9\u0627\u0644\u0645\u0647\u200C\u0627\u06CC \u0646\u062F\u0627\u0631\u06CC\u062F',
  'chats.empty.subtitle': '\u06CC\u06A9 \u0686\u062A \u062C\u062F\u06CC\u062F \u0634\u0631\u0648\u0639 \u06A9\u0646\u06CC\u062F',
  'chats.new': '\u0686\u062A \u062C\u062F\u06CC\u062F',
  'chats.search.placeholder': '\u062C\u0633\u062A\u062C\u0648\u06CC \u0645\u06A9\u0627\u0644\u0645\u0627\u062A',
  'chats.typing': '\u062F\u0631 \u062D\u0627\u0644 \u0646\u0648\u0634\u062A\u0646...',
  'chats.message.deleted': '\u067E\u06CC\u0627\u0645 \u062D\u0630\u0641 \u0634\u062F',
  'chats.message.photo': '\u0639\u06A9\u0633',
  'chats.message.video': '\u0648\u06CC\u062F\u06CC\u0648',
  'chats.message.voice': '\u067E\u06CC\u0627\u0645 \u0635\u0648\u062A\u06CC',
  'chats.message.document': '\u0633\u0646\u062F',
  'chats.message.placeholder': '\u067E\u06CC\u0627\u0645',
  'calls.title': '\u062A\u0645\u0627\u0633\u200C\u0647\u0627',
  'calls.empty': '\u0647\u0646\u0648\u0632 \u062A\u0645\u0627\u0633\u06CC \u0646\u062F\u0627\u0631\u06CC\u062F',
  'calls.missed': '\u0627\u0632 \u062F\u0633\u062A \u0631\u0641\u062A\u0647',
  'calls.incoming': '\u0648\u0631\u0648\u062F\u06CC',
  'calls.outgoing': '\u062E\u0631\u0648\u062C\u06CC',
  'profile.title': '\u067E\u0631\u0648\u0641\u0627\u06CC\u0644',
  'profile.edit': '\u0648\u06CC\u0631\u0627\u06CC\u0634 \u067E\u0631\u0648\u0641\u0627\u06CC\u0644',
  'profile.name': '\u0646\u0627\u0645',
  'profile.username': '\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC',
  'profile.bio': '\u0628\u06CC\u0648',
  'profile.phone': '\u062A\u0644\u0641\u0646',
  'settings.title': '\u062A\u0646\u0638\u06CC\u0645\u0627\u062A',
  'settings.appearance': '\u0638\u0627\u0647\u0631',
  'settings.notifications': '\u0627\u0639\u0644\u0627\u0646\u200C\u0647\u0627',
  'settings.privacy': '\u062D\u0631\u06CC\u0645 \u062E\u0635\u0648\u0635\u06CC \u0648 \u0627\u0645\u0646\u06CC\u062A',
  'settings.storage': '\u062F\u0627\u062F\u0647 \u0648 \u0630\u062E\u06CC\u0631\u0647\u200C\u0633\u0627\u0632\u06CC',
  'settings.theme.light': '\u0631\u0648\u0634\u0646',
  'settings.theme.dark': '\u062A\u0627\u0631\u06CC\u06A9',
  'settings.theme.system': '\u0633\u06CC\u0633\u062A\u0645',
};

const translations: Record<string, Record<TranslationKey, string>> = { en, fa };

let currentLocale = 'en';

export function initLocalization() {
  const locales = getLocales();
  const deviceLang = locales[0]?.languageCode || 'en';
  currentLocale = translations[deviceLang] ? deviceLang : 'en';
}

export function t(key: TranslationKey): string {
  return translations[currentLocale]?.[key] ?? translations['en']![key] ?? key;
}

export function setLocale(locale: string) {
  if (translations[locale]) {
    currentLocale = locale;
  }
}

export function getLocale(): string {
  return currentLocale;
}
