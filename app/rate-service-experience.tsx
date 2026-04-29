import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FadeInView } from '@/components/fade-in-view';
import { InteractivePressable } from '@/components/interactive-pressable';
import { KeyboardSafeScrollView } from '@/components/keyboard-safe-scroll-view';
import {
  GraceCourtRadius,
  GraceCourtShadows,
  GraceCourtSpacing,
  type GraceCourtColorPalette,
} from '@/constants/gracecourt-ui';
import { useAuth } from '@/lib/auth-context';
import { useAppSettings } from '@/lib/settings-context';
import { supabase } from '@/lib/supabase';
import { getFriendlyActionErrorMessage } from '@/lib/user-facing-error';

const ratingOptions = [1, 2, 3, 4, 5] as const;
type RatingValue = (typeof ratingOptions)[number];

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function RateServiceExperienceScreen() {
  const router = useRouter();
  const { currentUser, currentUserProfile } = useAuth();
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selectedRating, setSelectedRating] = useState<RatingValue | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');

  const handleRatingSelect = (rating: RatingValue) => {
    setSelectedRating(rating);
    setSubmitMessage('');
    setSubmitStatus('idle');
  };

  const handleSubmit = async () => {
    if (submitStatus === 'submitting') {
      return;
    }

    if (!selectedRating) {
      setSubmitStatus('error');
      setSubmitMessage('Please choose a rating before submitting.');
      return;
    }

    const userEmail = currentUserProfile?.email ?? currentUser?.email ?? '';

    if (!isAnonymous && !userEmail) {
      setSubmitStatus('error');
      setSubmitMessage('We could not find your email. Please sign in again and try once more.');
      return;
    }

    setSubmitStatus('submitting');
    setSubmitMessage('');

    try {
      const { error } = await supabase.from('service_feedback').insert({
        user_email: isAnonymous ? null : userEmail,
        rating: selectedRating,
        remarks: remarks.trim() || null,
        is_anonymous: isAnonymous,
      });

      if (error) {
        throw error;
      }

      setRemarks('');
      setIsAnonymous(false);
      setSelectedRating(null);
      setSubmitStatus('success');
      setSubmitMessage('Thank you. Your feedback has been submitted.');
    } catch (error) {
      console.error('Failed to submit service feedback.', error);
      setSubmitStatus('error');
      setSubmitMessage(
        getFriendlyActionErrorMessage(error, 'We could not submit your feedback right now. Please try again.')
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardSafeScrollView contentContainerStyle={styles.content}>
        <FadeInView>
          <View style={styles.topRow}>
            <InteractivePressable
              accessibilityRole="button"
              onPress={() => {
                router.replace('/(tabs)/profile');
              }}
              style={styles.backButton}>
              <Ionicons name="arrow-back" size={18} color={colors.accent} />
              <Text style={styles.backButtonText}>Profile</Text>
            </InteractivePressable>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>{"Rate Today's Service Experience"}</Text>
            <Text style={styles.subtitle}>{"Tell us how today's service was for you"}</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.field}>
              <Text style={styles.label}>Your Rating</Text>
              <View style={styles.ratingRow}>
                {ratingOptions.map((rating) => {
                  const isSelected = selectedRating === rating;

                  return (
                    <InteractivePressable
                      key={rating}
                      accessibilityLabel={`Rate ${rating} out of 5`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      disabled={submitStatus === 'submitting'}
                      onPress={() => handleRatingSelect(rating)}
                      scaleTo={0.96}
                      style={[styles.ratingButton, isSelected && styles.ratingButtonSelected]}>
                      <Ionicons
                        name={isSelected ? 'star' : 'star-outline'}
                        size={22}
                        color={isSelected ? colors.surface : colors.accent}
                      />
                      <Text
                        style={[
                          styles.ratingButtonText,
                          isSelected && styles.ratingButtonTextSelected,
                        ]}>
                        {rating}
                      </Text>
                    </InteractivePressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Remarks</Text>
              <TextInput
                multiline
                numberOfLines={6}
                onChangeText={(nextRemarks) => {
                  setRemarks(nextRemarks);
                  setSubmitMessage('');
                  setSubmitStatus('idle');
                }}
                placeholder="What did you enjoy, and what can be improved?"
                placeholderTextColor={colors.textMuted}
                scrollEnabled={false}
                style={styles.remarksInput}
                textAlignVertical="top"
                value={remarks}
                editable={submitStatus !== 'submitting'}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleTextWrap}>
                <Text style={styles.label}>Submit anonymously</Text>
                <Text style={styles.toggleHint}>
                  Your email will not be attached to this feedback.
                </Text>
              </View>
              <Switch
                disabled={submitStatus === 'submitting'}
                ios_backgroundColor={colors.border}
                onValueChange={(nextValue) => {
                  setIsAnonymous(nextValue);
                  setSubmitMessage('');
                  setSubmitStatus('idle');
                }}
                thumbColor={isAnonymous ? colors.surface : colors.textMuted}
                trackColor={{ false: colors.border, true: colors.accent }}
                value={isAnonymous}
              />
            </View>

            {submitMessage ? (
              <View
                style={[
                  styles.feedbackCard,
                  submitStatus === 'success' ? styles.feedbackCardSuccess : styles.feedbackCardError,
                ]}>
                <Ionicons
                  name={submitStatus === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                  size={18}
                  color={submitStatus === 'success' ? '#0D6B3E' : '#A43A3A'}
                />
                <Text
                  style={[
                    styles.feedbackText,
                    submitStatus === 'success' ? styles.feedbackTextSuccess : styles.feedbackTextError,
                  ]}>
                  {submitMessage}
                </Text>
              </View>
            ) : null}

            <InteractivePressable
              accessibilityRole="button"
              activeOpacity={0.9}
              disabled={submitStatus === 'submitting'}
              onPress={() => {
                void handleSubmit();
              }}
              scaleTo={submitStatus === 'submitting' ? 1 : 0.98}
              style={[styles.submitButton, submitStatus === 'submitting' && styles.submitButtonDisabled]}>
              {submitStatus === 'submitting' ? (
                <View style={styles.submitContent}>
                  <ActivityIndicator color={colors.surface} size="small" />
                  <Text style={styles.submitButtonText}>Submitting...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Submit Feedback</Text>
              )}
            </InteractivePressable>
          </View>
        </FadeInView>
      </KeyboardSafeScrollView>
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
      fontSize: 30,
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
    formCard: {
      backgroundColor: colors.surface,
      borderRadius: GraceCourtRadius.large,
      padding: GraceCourtSpacing.cardPadding,
      gap: 20,
      ...GraceCourtShadows.card,
    },
    field: {
      gap: 10,
    },
    label: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    ratingRow: {
      flexDirection: 'row',
      gap: 8,
    },
    ratingButton: {
      flex: 1,
      minHeight: 58,
      borderRadius: GraceCourtRadius.medium,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.tintSurfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    ratingButtonSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
      ...GraceCourtShadows.accent,
    },
    ratingButtonText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.accent,
    },
    ratingButtonTextSelected: {
      color: colors.surface,
    },
    remarksInput: {
      minHeight: 150,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: GraceCourtRadius.medium,
      backgroundColor: colors.tintSurfaceAlt,
      paddingVertical: 14,
      paddingHorizontal: 16,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textPrimary,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 14,
      backgroundColor: colors.tintSurfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: GraceCourtRadius.medium,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    toggleTextWrap: {
      flex: 1,
    },
    toggleHint: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.accentSoft,
      marginTop: 4,
    },
    feedbackCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      borderRadius: GraceCourtRadius.medium,
      paddingVertical: 13,
      paddingHorizontal: 14,
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
      flex: 1,
      fontSize: 13,
      lineHeight: 20,
    },
    feedbackTextSuccess: {
      color: '#0D6B3E',
    },
    feedbackTextError: {
      color: '#A43A3A',
    },
    submitButton: {
      backgroundColor: colors.accent,
      borderRadius: GraceCourtRadius.medium,
      paddingVertical: 16,
      paddingHorizontal: 18,
      alignItems: 'center',
      justifyContent: 'center',
      ...GraceCourtShadows.accent,
    },
    submitButtonDisabled: {
      opacity: 0.86,
    },
    submitContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    submitButtonText: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.surface,
    },
  });
}
