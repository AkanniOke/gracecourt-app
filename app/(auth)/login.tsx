import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { AuthActionButton } from '@/components/auth/auth-action-button';
import { AuthFormField } from '@/components/auth/auth-form-field';
import { FadeInView } from '@/components/fade-in-view';
import { InteractivePressable } from '@/components/interactive-pressable';
import { KeyboardSafeScrollView } from '@/components/keyboard-safe-scroll-view';
import {
  GraceCourtColors,
  GraceCourtRadius,
  GraceCourtShadows,
  GraceCourtSpacing,
} from '@/constants/gracecourt-ui';
import { supabase } from '@/lib/supabase';
import { getFriendlyAuthErrorMessage } from '@/lib/user-facing-error';

type AuthStatus = 'idle' | 'loading' | 'error' | 'success';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ message?: string | string[] }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const welcomeMessage =
      typeof params.message === 'string' && params.message.length > 0 ? params.message : '';

    if (welcomeMessage) {
      setAuthStatus('success');
      setStatusMessage(welcomeMessage);
    }
  }, [params.message]);

  const handleLogin = async () => {
    if (authStatus === 'loading') {
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      setAuthStatus('error');
      setStatusMessage('Enter your email and password to continue.');
      return;
    }

    setAuthStatus('loading');
    setStatusMessage('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        throw error;
      }

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to sign in.', error);
      setAuthStatus('error');
      setStatusMessage(getFriendlyAuthErrorMessage(error, 'We could not sign you in right now. Please try again.'));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardSafeScrollView contentContainerStyle={styles.content}>
        <FadeInView style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to continue your journey with GraceCourt Global.
          </Text>

          <View style={styles.form}>
            <AuthFormField
              autoCapitalize="none"
              keyboardType="email-address"
              label="Email"
              onChangeText={setEmail}
              placeholder="Enter your email"
              value={email}
            />
            <AuthFormField
              label="Password"
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              value={password}
            />
          </View>

          {authStatus !== 'idle' ? (
            <View
              style={[
                styles.feedbackCard,
                authStatus === 'success' ? styles.feedbackCardSuccess : styles.feedbackCardError,
              ]}>
              <Text
                style={[
                  styles.feedbackText,
                  authStatus === 'success' ? styles.feedbackTextSuccess : styles.feedbackTextError,
                ]}>
                {statusMessage}
              </Text>
            </View>
          ) : null}

          <AuthActionButton
            disabled={authStatus === 'loading'}
            label={authStatus === 'loading' ? 'Logging In...' : 'Login'}
            loading={authStatus === 'loading'}
            onPress={() => {
              void handleLogin();
            }}
          />

          <InteractivePressable
            accessibilityRole="button"
            activeOpacity={0.92}
            onPress={() => {}}
            scaleTo={0.99}>
            <Text style={styles.textButton}>Forgot Password</Text>
          </InteractivePressable>

          <Text style={styles.footerText}>
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" style={styles.footerLink}>
              Sign Up
            </Link>
          </Text>
        </FadeInView>
      </KeyboardSafeScrollView>
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
  card: {
    backgroundColor: GraceCourtColors.surface,
    borderRadius: GraceCourtRadius.large,
    paddingVertical: 28,
    paddingHorizontal: 24,
    ...GraceCourtShadows.card,
  },
  title: {
    fontSize: 31,
    fontWeight: '800',
    color: GraceCourtColors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: GraceCourtColors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  form: {
    gap: 16,
    marginBottom: 20,
  },
  feedbackCard: {
    borderRadius: GraceCourtRadius.medium,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  feedbackCardSuccess: {
    backgroundColor: '#EAF8F0',
    borderWidth: 1,
    borderColor: '#BEE4CD',
  },
  feedbackCardError: {
    backgroundColor: '#FFF1F1',
    borderWidth: 1,
    borderColor: '#F2C7C7',
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 20,
  },
  feedbackTextSuccess: {
    color: '#0D6B3E',
  },
  feedbackTextError: {
    color: '#A43A3A',
  },
  textButton: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '600',
    color: GraceCourtColors.accent,
    textAlign: 'center',
  },
  footerText: {
    marginTop: 22,
    fontSize: 14,
    lineHeight: 20,
    color: GraceCourtColors.textMuted,
    textAlign: 'center',
  },
  footerLink: {
    color: GraceCourtColors.accent,
    fontWeight: '700',
  },
});
