import { Redirect } from 'expo-router';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import {
  GraceCourtColors,
  GraceCourtSpacing,
} from '@/constants/gracecourt-ui';
import { useAuth } from '@/lib/auth-context';

export default function AppEntryScreen() {
  const { authReady, session } = useAuth();

  if (!authReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <ActivityIndicator size="small" color={GraceCourtColors.surface} />
          <Text style={styles.text}>Preparing GraceCourt Global...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)" />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: GraceCourtColors.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: GraceCourtSpacing.tight,
    paddingHorizontal: GraceCourtSpacing.screenX,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: GraceCourtColors.surface,
    textAlign: 'center',
  },
});
