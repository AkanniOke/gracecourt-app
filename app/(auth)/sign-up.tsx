import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { AuthActionButton } from '@/components/auth/auth-action-button';
import { AuthFormField } from '@/components/auth/auth-form-field';
import { FadeInView } from '@/components/fade-in-view';
import { KeyboardSafeScrollView } from '@/components/keyboard-safe-scroll-view';
import {
  GraceCourtColors,
  GraceCourtRadius,
  GraceCourtShadows,
  GraceCourtSpacing,
} from '@/constants/gracecourt-ui';
import { DEFAULT_USER_POSITION, DEFAULT_USER_ROLE, ensureUserProfileExists } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getFriendlyAuthErrorMessage } from '@/lib/user-facing-error';

type AuthStatus = 'idle' | 'loading' | 'error' | 'success';

export default function SignUpScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleSignUp = async () => {
    if (authStatus === 'loading') {
      return;
    }

    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (!trimmedFullName || !trimmedEmail || !trimmedPhone || !password || !confirmPassword) {
      setAuthStatus('error');
      setStatusMessage('Complete all fields before creating your account.');
      return;
    }

    if (password !== confirmPassword) {
      setAuthStatus('error');
      setStatusMessage('Password and confirm password must match.');
      return;
    }

    if (password.length < 6) {
      setAuthStatus('error');
      setStatusMessage('Use a password with at least 6 characters.');
      return;
    }

    setAuthStatus('loading');
    setStatusMessage('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedFullName,
            phone: trimmedPhone,
            position: DEFAULT_USER_POSITION,
            role: DEFAULT_USER_ROLE,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        try {
          await ensureUserProfileExists({
            user: data.user,
            email: data.user.email ?? trimmedEmail,
            fullName: trimmedFullName,
            phone: trimmedPhone,
          });
        } catch (profileError) {
          console.error('Failed to create profile immediately after signup.', {
            email: trimmedEmail,
            userId: data.user.id,
            error: profileError,
          });
        }
      }

      setAuthStatus('success');

      if (data.session) {
        router.replace('/(tabs)');
        return;
      }

      setStatusMessage('Account created successfully. Check your email if confirmation is required, then log in.');
      router.replace({
        pathname: '/login',
        params: {
          message: 'Account created successfully. Check your email if confirmation is required, then log in.',
        },
      });
    } catch (error) {
      console.error('Failed to sign up.', error);
      setAuthStatus('error');
      setStatusMessage(
        getFriendlyAuthErrorMessage(error, 'We could not create your account right now. Please try again.')
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardSafeScrollView contentContainerStyle={styles.content}>
        <FadeInView style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join the GraceCourt family and get connected to your church life.
          </Text>

          <View style={styles.form}>
            <AuthFormField
              autoCapitalize="words"
              label="Full Name"
              onChangeText={setFullName}
              placeholder="Enter your full name"
              value={fullName}
            />
            <AuthFormField
              autoCapitalize="none"
              keyboardType="email-address"
              label="Email"
              onChangeText={setEmail}
              placeholder="Enter your email"
              value={email}
            />
            <AuthFormField
              keyboardType="phone-pad"
              label="Phone Number"
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              value={phone}
            />
            <AuthFormField
              label="Password"
              onChangeText={setPassword}
              placeholder="Create a password"
              secureTextEntry
              value={password}
            />
            <AuthFormField
              label="Confirm Password"
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry
              value={confirmPassword}
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
            label={authStatus === 'loading' ? 'Creating Account...' : 'Create Account'}
            loading={authStatus === 'loading'}
            onPress={() => {
              void handleSignUp();
            }}
          />

          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Link href="/login" style={styles.footerLink}>
              Login
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
