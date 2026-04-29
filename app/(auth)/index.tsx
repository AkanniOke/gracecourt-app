import { useRouter } from 'expo-router';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthActionButton } from '@/components/auth/auth-action-button';
import { FadeInView } from '@/components/fade-in-view';
import {
  GraceCourtColors,
  GraceCourtRadius,
  GraceCourtShadows,
  GraceCourtSpacing,
} from '@/constants/gracecourt-ui';

const churchLogo = require('@/assets/images/logo.png.png');
const churchImage = require('@/assets/images/church.jpg');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <FadeInView style={styles.heroCard}>
          <Image source={churchLogo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>GraceCourt Global</Text>
          <Text style={styles.caption}>the haven of influence</Text>
          <Text style={styles.message}>
            Welcome to your church companion for prayer, fellowship, sermons, and staying connected
            with the GraceCourt family wherever you are.
          </Text>

          <View style={styles.imageFrame}>
            <Image source={churchImage} style={styles.heroImage} resizeMode="cover" />
          </View>

          <View style={styles.buttonGroup}>
            <AuthActionButton label="Login" onPress={() => router.push('/login')} />
            <AuthActionButton
              label="Create Account"
              onPress={() => router.push('/sign-up')}
              variant="secondary"
            />
          </View>

          <View style={styles.communityCard}>
            <Text style={styles.communityTitle}>A warm place to belong</Text>
            <Text style={styles.communityText}>
              Grow in faith, share prayer requests, and stay close to your church community in one
              calm, welcoming space.
            </Text>
          </View>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: GraceCourtColors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: GraceCourtSpacing.screenX,
    paddingTop: GraceCourtSpacing.screenTop,
    paddingBottom: GraceCourtSpacing.screenBottom,
  },
  heroCard: {
    backgroundColor: GraceCourtColors.surface,
    borderRadius: GraceCourtRadius.large,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    ...GraceCourtShadows.card,
  },
  logo: {
    width: 108,
    height: 108,
    marginBottom: 14,
  },
  title: {
    fontSize: 31,
    fontWeight: '800',
    color: GraceCourtColors.textPrimary,
    textAlign: 'center',
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    color: GraceCourtColors.accentSoft,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    lineHeight: 24,
    color: GraceCourtColors.textSecondary,
    textAlign: 'center',
    marginBottom: 18,
  },
  imageFrame: {
    width: '100%',
    borderRadius: GraceCourtRadius.card,
    overflow: 'hidden',
    marginBottom: 20,
    ...GraceCourtShadows.subtle,
  },
  heroImage: {
    width: '100%',
    height: 168,
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  communityCard: {
    width: '100%',
    borderRadius: GraceCourtRadius.card,
    backgroundColor: GraceCourtColors.tintSurface,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  communityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GraceCourtColors.accent,
    marginBottom: 6,
    textAlign: 'center',
  },
  communityText: {
    fontSize: 14,
    lineHeight: 22,
    color: GraceCourtColors.textSecondary,
    textAlign: 'center',
  },
});
