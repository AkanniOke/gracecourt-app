import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { FadeInView } from '@/components/fade-in-view';
import { InteractivePressable } from '@/components/interactive-pressable';
import {
  GraceCourtRadius,
  GraceCourtShadows,
  GraceCourtSpacing,
  type GraceCourtColorPalette,
  type GraceCourtThemeName,
} from '@/constants/gracecourt-ui';
import {
  PUSH_NOTIFICATIONS_TEMPORARILY_DISABLED,
  PUSH_NOTIFICATIONS_TEMPORARY_MESSAGE,
} from '@/lib/push-notifications';
import { useAppSettings } from '@/lib/settings-context';
import { getFriendlyActionErrorMessage } from '@/lib/user-facing-error';

type FeedbackTone = 'error' | 'success';

const themeOptions: { label: string; value: GraceCourtThemeName }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const {
    colors,
    settingsReady,
    selectedTheme,
    setSelectedTheme,
  } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>('success');

  const setFeedback = (tone: FeedbackTone, message: string) => {
    setFeedbackTone(tone);
    setFeedbackMessage(message);
  };

  const handleThemeChange = async (theme: GraceCourtThemeName) => {
    if (theme === selectedTheme || isSavingTheme) {
      return;
    }

    setIsSavingTheme(true);
    setFeedbackMessage('');

    try {
      await setSelectedTheme(theme);
      setFeedback('success', `${theme === 'dark' ? 'Dark' : 'Light'} theme applied.`);
    } catch (error) {
      console.error('Failed to update theme preference.', error);
      setFeedback('error', getFriendlyActionErrorMessage(error, 'We could not update the theme right now.'));
    } finally {
      setIsSavingTheme(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <FadeInView>
          <View style={styles.topRow}>
            <InteractivePressable
              onPress={() => {
                router.replace('/(tabs)/profile');
              }}
              style={styles.backButton}>
              <Ionicons name="arrow-back" size={18} color={colors.accent} />
              <Text style={styles.backButtonText}>Profile</Text>
            </InteractivePressable>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Manage notifications and appearance.</Text>
          </View>

          <View style={styles.settingsList}>
            <View style={styles.settingRow}>
              <View style={styles.settingIconWrap}>
                <Ionicons name="notifications-outline" size={22} color={colors.accent} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Enable Notifications</Text>
                <Text style={styles.settingDescription}>
                  {PUSH_NOTIFICATIONS_TEMPORARILY_DISABLED
                    ? PUSH_NOTIFICATIONS_TEMPORARY_MESSAGE
                    : 'Receive GraceCourt updates on this device.'}
                </Text>
              </View>
              <Switch
                disabled
                ios_backgroundColor={colors.border}
                thumbColor={colors.textMuted}
                trackColor={{ false: colors.border, true: colors.border }}
                value={false}
              />
            </View>

            <View style={styles.settingBlock}>
              <View style={styles.settingBlockHeader}>
                <View style={styles.settingIconWrap}>
                  <Ionicons name="contrast-outline" size={22} color={colors.accent} />
                </View>
                <View style={styles.settingTextWrap}>
                  <Text style={styles.settingTitle}>Theme</Text>
                  <Text style={styles.settingDescription}>
                    Choose the app appearance for this device.
                  </Text>
                </View>
              </View>

              <View style={styles.segmentedControl}>
                {themeOptions.map((option) => {
                  const isSelected = selectedTheme === option.value;

                  return (
                    <InteractivePressable
                      key={option.value}
                      disabled={isSavingTheme}
                      onPress={() => {
                        void handleThemeChange(option.value);
                      }}
                      style={[styles.themeButton, isSelected && styles.themeButtonSelected]}>
                      <Ionicons
                        name={option.value === 'dark' ? 'moon-outline' : 'sunny-outline'}
                        size={17}
                        color={isSelected ? colors.surface : colors.accent}
                      />
                      <Text
                        style={[
                          styles.themeButtonText,
                          isSelected && styles.themeButtonTextSelected,
                        ]}>
                        {option.label}
                      </Text>
                    </InteractivePressable>
                  );
                })}
              </View>
            </View>
          </View>

          {PUSH_NOTIFICATIONS_TEMPORARILY_DISABLED ? (
            <View style={styles.noticeCard}>
              <Text style={styles.noticeTitle}>Notification setup note</Text>
              <Text style={styles.noticeText}>{PUSH_NOTIFICATIONS_TEMPORARY_MESSAGE}</Text>
            </View>
          ) : null}

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

          {!settingsReady ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.accent} size="small" />
              <Text style={styles.loadingText}>Loading saved settings...</Text>
            </View>
          ) : null}
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
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
    topRow: {
      marginBottom: 16,
    },
    backButton: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.surface,
      borderRadius: GraceCourtRadius.pill,
      paddingVertical: 10,
      paddingHorizontal: 14,
      ...GraceCourtShadows.subtle,
    },
    backButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.accent,
    },
    header: {
      marginBottom: GraceCourtSpacing.section,
    },
    title: {
      fontSize: 31,
      fontWeight: '800',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSoft,
      textAlign: 'center',
      marginTop: 8,
    },
    settingsList: {
      gap: GraceCourtSpacing.tight,
    },
    settingRow: {
      backgroundColor: colors.surface,
      borderRadius: GraceCourtRadius.large,
      paddingVertical: 18,
      paddingHorizontal: 18,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      ...GraceCourtShadows.card,
    },
    settingBlock: {
      backgroundColor: colors.surface,
      borderRadius: GraceCourtRadius.large,
      padding: 18,
      ...GraceCourtShadows.card,
    },
    settingBlockHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    settingIconWrap: {
      width: 44,
      height: 44,
      borderRadius: GraceCourtRadius.icon,
      backgroundColor: colors.tintSurface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingTextWrap: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.accentSoft,
    },
    segmentedControl: {
      flexDirection: 'row',
      gap: 10,
    },
    themeButton: {
      flex: 1,
      minHeight: 50,
      borderRadius: GraceCourtRadius.medium,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.tintSurfaceAlt,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 12,
    },
    themeButtonSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    themeButtonText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.accent,
    },
    themeButtonTextSelected: {
      color: colors.surface,
    },
    feedbackCard: {
      borderRadius: GraceCourtRadius.medium,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginTop: GraceCourtSpacing.section,
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
    noticeCard: {
      backgroundColor: '#FFF8E8',
      borderWidth: 1,
      borderColor: '#EACB7A',
      borderRadius: GraceCourtRadius.medium,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginTop: GraceCourtSpacing.section,
    },
    noticeTitle: {
      color: '#7A4C00',
      fontSize: 13,
      fontWeight: '800',
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    noticeText: {
      color: '#7A4C00',
      fontSize: 13,
      lineHeight: 20,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      marginTop: 18,
    },
    loadingText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSoft,
    },
  });
}
