import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/lib/auth-context';
import { SettingsProvider } from '@/lib/settings-context';

export default function RootLayout() {
  return (
    <SettingsProvider>
      <RootLayoutContent />
    </SettingsProvider>
  );
}

function RootLayoutContent() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="admin-panel" options={{ headerShown: false }} />
          <Stack.Screen name="admin/manage-announcements" options={{ headerShown: false }} />
          <Stack.Screen name="admin/manage-events" options={{ headerShown: false }} />
          <Stack.Screen name="admin/manage-sermons" options={{ headerShown: false }} />
          <Stack.Screen name="admin/manage-daily-prayers" options={{ headerShown: false }} />
          <Stack.Screen name="admin/manage-fff-centres" options={{ headerShown: false }} />
          <Stack.Screen name="admin/manage-users" options={{ headerShown: false }} />
          <Stack.Screen name="admin/view-prayer-requests" options={{ headerShown: false }} />
          <Stack.Screen name="admin/view-service-feedback" options={{ headerShown: false }} />
          <Stack.Screen name="sermons/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="daily-prayer" options={{ headerShown: false }} />
          <Stack.Screen name="prayer-request" options={{ headerShown: false }} />
          <Stack.Screen name="fff-centres" options={{ headerShown: false }} />
          <Stack.Screen name="rate-service-experience" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </AuthProvider>
  );
}
