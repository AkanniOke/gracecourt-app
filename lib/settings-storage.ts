import AsyncStorage from '@react-native-async-storage/async-storage';

import type { GraceCourtThemeName } from '@/constants/gracecourt-ui';

const NOTIFICATIONS_ENABLED_STORAGE_KEY = 'gracecourt.notificationsEnabled';
const THEME_STORAGE_KEY = 'gracecourt.theme';

export const DEFAULT_NOTIFICATIONS_ENABLED = false;
export const DEFAULT_THEME: GraceCourtThemeName = 'light';

export async function getStoredNotificationsEnabled() {
  const storedValue = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_STORAGE_KEY);

  if (storedValue === null) {
    return DEFAULT_NOTIFICATIONS_ENABLED;
  }

  return storedValue === 'true';
}

export async function setStoredNotificationsEnabled(enabled: boolean) {
  await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_STORAGE_KEY, String(enabled));
}

export async function getStoredThemePreference() {
  const storedValue = await AsyncStorage.getItem(THEME_STORAGE_KEY);

  return storedValue === 'dark' || storedValue === 'light' ? storedValue : DEFAULT_THEME;
}

export async function setStoredThemePreference(theme: GraceCourtThemeName) {
  await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
}
