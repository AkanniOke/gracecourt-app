import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useMemo, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FadeInView } from '@/components/fade-in-view';
import { InteractivePressable } from '@/components/interactive-pressable';
import {
  GraceCourtRadius,
  GraceCourtShadows,
  GraceCourtSpacing,
  type GraceCourtColorPalette,
} from '@/constants/gracecourt-ui';
import { useAuth } from '@/lib/auth-context';
import { uploadProfilePhoto } from '@/lib/profile-photo';
import { useAppSettings } from '@/lib/settings-context';
import { supabase } from '@/lib/supabase';
import { getFriendlyActionErrorMessage } from '@/lib/user-facing-error';

type FeedbackTone = 'error' | 'success';

type MenuItem = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
};

const baseMenuItems: MenuItem[] = [
  { label: "Rate Today's Service Experience", icon: 'star-outline' },
  { label: 'Settings', icon: 'settings-outline' },
  { label: 'Logout', icon: 'log-out-outline' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { currentUser, currentUserProfile, isAdmin, refreshCurrentUserProfile } = useAuth();
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>('success');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const menuItems: MenuItem[] = [
    ...(isAdmin
      ? [{ label: 'Admin Panel', icon: 'shield-checkmark-outline' } satisfies MenuItem]
      : []),
    ...baseMenuItems,
  ];

  const profileSummary = {
    avatarUrl: currentUserProfile?.avatarUrl ?? null,
    email: currentUserProfile?.email ?? currentUser?.email ?? 'member@example.com',
    fullName: currentUserProfile?.fullName ?? 'GraceCourt Member',
    position: currentUserProfile?.position ?? 'Member',
  };

  const setFeedback = (tone: FeedbackTone, message: string) => {
    setFeedbackTone(tone);
    setFeedbackMessage(message);
  };

  const handleAvatarPress = async () => {
    if (!currentUser || isUploadingAvatar) {
      return;
    }

    setIsUploadingAvatar(true);
    setFeedbackMessage('');

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        setFeedback('error', 'Photo library permission is needed to choose a profile photo.');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (pickerResult.canceled) {
        return;
      }

      const selectedAsset = pickerResult.assets[0];

      if (!selectedAsset) {
        setFeedback('error', 'No image was selected. Please try again.');
        return;
      }

      await uploadProfilePhoto({
        asset: selectedAsset,
        currentAvatarUrl: currentUserProfile?.avatarUrl ?? null,
        userId: currentUser.id,
      });
      await refreshCurrentUserProfile();
      setFeedback('success', 'Profile photo updated successfully.');
    } catch (error) {
      console.error('Failed to upload profile photo.', error);
      setFeedback(
        'error',
        getFriendlyActionErrorMessage(
          error,
          'We could not update your profile photo right now. Please try again.'
        )
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleMenuPress = async (label: string) => {
    if (label === 'Admin Panel') {
      router.push('/admin-panel');
      return;
    }

    if (label === 'Settings') {
      router.push('/settings');
      return;
    }

    if (label === "Rate Today's Service Experience") {
      router.push('/rate-service-experience');
      return;
    }

    if (label === 'Logout') {
      try {
        const { error } = await supabase.auth.signOut();

        if (error) {
          throw error;
        }

        router.replace('/(auth)');
      } catch (error) {
        console.error('Failed to sign out.', error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <FadeInView>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Your GraceCourt account and personal activity.</Text>

          <View style={styles.profileCard}>
            <InteractivePressable
              disabled={!currentUser || isUploadingAvatar}
              onPress={() => {
                void handleAvatarPress();
              }}
              style={styles.avatarShell}>
              <View style={styles.avatar}>
                {profileSummary.avatarUrl ? (
                  <Image
                    contentFit="cover"
                    source={{ uri: profileSummary.avatarUrl }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarInitials}>{getInitials(profileSummary.fullName)}</Text>
                )}

                <View style={styles.avatarBadge}>
                  {isUploadingAvatar ? (
                    <ActivityIndicator color={colors.surface} size="small" />
                  ) : (
                    <Ionicons name="camera-outline" size={16} color={colors.surface} />
                  )}
                </View>
              </View>
            </InteractivePressable>

            <Text style={styles.avatarHint}>
              {isUploadingAvatar ? 'Uploading profile photo...' : 'Tap your avatar to change your photo'}
            </Text>
            <Text style={styles.name}>{profileSummary.fullName}</Text>
            <Text style={styles.contact}>{profileSummary.email}</Text>
            <Text style={styles.memberBadge}>{profileSummary.position}</Text>
          </View>

          {feedbackMessage ? (
            <View
              style={[
                styles.feedbackCard,
                feedbackTone === 'success' ? styles.feedbackCardSuccess : styles.feedbackCardError,
              ]}>
              <Text
                style={[
                  styles.feedbackText,
                  feedbackTone === 'success'
                    ? styles.feedbackTextSuccess
                    : styles.feedbackTextError,
                ]}>
                {feedbackMessage}
              </Text>
            </View>
          ) : null}

          <View style={styles.menuList}>
            {menuItems.map((item) => (
              <InteractivePressable
                key={item.label}
                onPress={() => {
                  void handleMenuPress(item.label);
                }}
                style={styles.menuItem}>
                <View style={styles.menuLeft}>
                  <View style={styles.iconWrap}>
                    <Ionicons name={item.icon} size={20} color={colors.accent} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </InteractivePressable>
            ))}
          </View>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

function getInitials(fullName: string) {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((namePart) => namePart.charAt(0).toUpperCase())
    .join('');

  return initials || 'GC';
}

function createStyles(colors: GraceCourtColorPalette) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: GraceCourtSpacing.screenX,
      paddingTop: GraceCourtSpacing.screenTop,
      paddingBottom: GraceCourtSpacing.screenBottom,
    },
    title: {
      fontSize: 31,
      fontWeight: '800',
      color: colors.surface === '#FFFFFF' ? colors.surface : colors.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSoft,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 24,
    },
    profileCard: {
      backgroundColor: colors.surface,
      borderRadius: GraceCourtRadius.large,
      paddingVertical: 30,
      paddingHorizontal: 24,
      alignItems: 'center',
      marginBottom: 24,
      ...GraceCourtShadows.card,
    },
    avatarShell: {
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor: colors.tintSurface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    avatar: {
      width: 92,
      height: 92,
      borderRadius: 46,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      ...GraceCourtShadows.subtle,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarInitials: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.accent,
    },
    avatarBadge: {
      position: 'absolute',
      right: 4,
      bottom: 4,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.surface,
    },
    avatarHint: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.accentSoft,
      marginBottom: 12,
      textAlign: 'center',
    },
    name: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 6,
      textAlign: 'center',
    },
    contact: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.accentSoft,
      marginBottom: 12,
      textAlign: 'center',
    },
    memberBadge: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.accent,
      backgroundColor: colors.tintSurface,
      borderRadius: GraceCourtRadius.pill,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    feedbackCard: {
      borderRadius: GraceCourtRadius.medium,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: GraceCourtSpacing.section,
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
    menuList: {
      gap: 12,
    },
    menuItem: {
      backgroundColor: colors.surface,
      borderRadius: GraceCourtRadius.medium,
      paddingVertical: 16,
      paddingHorizontal: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...GraceCourtShadows.subtle,
    },
    menuLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: GraceCourtRadius.icon,
      backgroundColor: colors.tintSurface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
  });
}
