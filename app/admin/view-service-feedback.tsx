import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FadeInView } from '@/components/fade-in-view';
import { InteractivePressable } from '@/components/interactive-pressable';
import {
  GraceCourtColors,
  GraceCourtRadius,
  GraceCourtShadows,
  GraceCourtSpacing,
} from '@/constants/gracecourt-ui';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

type ServiceFeedbackRecord = {
  created_at: string;
  id: string;
  is_anonymous: boolean;
  rating: number;
  remarks: string | null;
  user_email: string | null;
};

type FeedbackTone = 'error' | 'success';

export default function ViewServiceFeedbackScreen() {
  const router = useRouter();
  const { authReady, isAdmin, session } = useAuth();
  const [serviceFeedback, setServiceFeedback] = useState<ServiceFeedbackRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingFeedbackId, setDeletingFeedbackId] = useState<string | null>(null);
  const [listErrorMessage, setListErrorMessage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>('success');

  const setFeedback = (tone: FeedbackTone, nextMessage: string) => {
    setFeedbackTone(tone);
    setFeedbackMessage(nextMessage);
  };

  const loadServiceFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('service_feedback')
        .select('id, user_email, rating, remarks, is_anonymous, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setServiceFeedback(
        (data ?? []).map((item) => ({
          created_at: item.created_at,
          id: String(item.id),
          is_anonymous: Boolean(item.is_anonymous),
          rating: Number(item.rating),
          remarks: item.remarks ?? null,
          user_email: item.user_email ?? null,
        }))
      );
      setListErrorMessage('');
    } catch (error) {
      console.error('Failed to load service feedback for admin.', error);
      setServiceFeedback([]);
      setListErrorMessage('We could not load service feedback right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    void loadServiceFeedback();
  }, [authReady, isAdmin]);

  const handleDeleteFeedback = (feedback: ServiceFeedbackRecord) => {
    Alert.alert(
      'Delete service feedback?',
      'This feedback entry will be permanently removed from the admin view.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteFeedback(feedback.id);
          },
        },
      ]
    );
  };

  const deleteFeedback = async (feedbackId: string) => {
    if (deletingFeedbackId) {
      return;
    }

    setDeletingFeedbackId(feedbackId);
    setFeedbackMessage('');

    try {
      const { error } = await supabase
        .from('service_feedback')
        .delete()
        .eq('id', feedbackId);

      if (error) {
        throw error;
      }

      setFeedback('success', 'Service feedback deleted successfully.');
      await loadServiceFeedback();
    } catch (error) {
      console.error('Failed to delete service feedback.', error);
      setFeedback(
        'error',
        error instanceof Error
          ? error.message
          : 'We could not delete this feedback right now.'
      );
    } finally {
      setDeletingFeedbackId(null);
    }
  };

  if (!authReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredState}>
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Loading admin tools...</Text>
            <Text style={styles.stateText}>
              We are checking your access before opening service feedback.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    const deniedActionLabel = session ? 'Back to Profile' : 'Go to Sign In';

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredState}>
          <FadeInView style={styles.stateCard}>
            <View style={styles.deniedIconWrap}>
              <Ionicons name="lock-closed-outline" size={28} color={GraceCourtColors.accent} />
            </View>
            <Text style={styles.stateTitle}>Access denied</Text>
            <Text style={styles.stateText}>
              Only users with the admin role can view service feedback.
            </Text>
            <InteractivePressable
              onPress={() => {
                router.replace(session ? '/(tabs)/profile' : '/(auth)');
              }}
              style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>{deniedActionLabel}</Text>
            </InteractivePressable>
          </FadeInView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <FadeInView>
          <View style={styles.topRow}>
            <InteractivePressable
              onPress={() => {
                router.replace('/admin-panel');
              }}
              style={styles.backButton}>
              <Ionicons name="arrow-back" size={18} color={GraceCourtColors.accent} />
              <Text style={styles.backButtonText}>Admin Panel</Text>
            </InteractivePressable>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <Ionicons name="star-outline" size={18} color={GraceCourtColors.accent} />
              <Text style={styles.heroBadgeText}>Admin Only</Text>
            </View>
            <Text style={styles.title}>View Service Feedback</Text>
            <Text style={styles.subtitle}>
              Review submitted service ratings and member remarks.
            </Text>
          </View>

          {feedbackMessage ? (
            <View
              style={[
                styles.feedbackCard,
                feedbackTone === 'success'
                  ? styles.feedbackCardSuccess
                  : styles.feedbackCardError,
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

          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>Submitted Feedback</Text>

            {isLoading ? (
              <View style={styles.stateCardInline}>
                <Text style={styles.stateInlineText}>Loading service feedback...</Text>
              </View>
            ) : listErrorMessage ? (
              <View style={styles.stateCardInline}>
                <Text style={styles.stateInlineTitle}>Feedback unavailable</Text>
                <Text style={styles.stateInlineText}>{listErrorMessage}</Text>
              </View>
            ) : serviceFeedback.length === 0 ? (
              <View style={styles.stateCardInline}>
                <Text style={styles.stateInlineTitle}>No feedback yet</Text>
                <Text style={styles.stateInlineText}>
                  Submitted service ratings will appear here once members send them in.
                </Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {serviceFeedback.map((feedback) => {
                  const isDeleting = deletingFeedbackId === feedback.id;

                  return (
                    <View key={feedback.id} style={styles.feedbackItemCard}>
                      <View style={styles.cardHeader}>
                        <View style={styles.userBlock}>
                          <Text style={styles.userEmail}>
                            {feedback.is_anonymous
                              ? 'Anonymous'
                              : feedback.user_email || 'Unknown member'}
                          </Text>
                          <Text style={styles.createdAt}>
                            {formatCreatedAt(feedback.created_at)}
                          </Text>
                        </View>
                        <View style={styles.ratingBadge}>
                          <Ionicons name="star" size={15} color={GraceCourtColors.surface} />
                          <Text style={styles.ratingBadgeText}>{feedback.rating}/5</Text>
                        </View>
                      </View>

                      <View style={styles.ratingRow}>
                        {renderStars(feedback.rating).map((isFilled, index) => (
                          <Ionicons
                            key={`${feedback.id}-${index}`}
                            name={isFilled ? 'star' : 'star-outline'}
                            size={20}
                            color={GraceCourtColors.accent}
                          />
                        ))}
                      </View>

                      <View style={styles.remarksBlock}>
                        <Text style={styles.metaLabel}>Remarks</Text>
                        <Text
                          style={[
                            styles.remarksText,
                            !feedback.remarks?.trim() && styles.emptyRemarksText,
                          ]}>
                          {feedback.remarks?.trim() || 'No remarks provided'}
                        </Text>
                      </View>

                      <View style={styles.cardActions}>
                        <InteractivePressable
                          disabled={isDeleting}
                          onPress={() => {
                            handleDeleteFeedback(feedback);
                          }}
                          style={[styles.deleteButton, isDeleting && styles.buttonDisabled]}>
                          <Text style={styles.deleteButtonText}>
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </Text>
                        </InteractivePressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatCreatedAt(dateValue: string) {
  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsedDate);
}

function renderStars(rating: number) {
  const normalizedRating = Math.max(0, Math.min(5, Math.round(rating)));

  return Array.from({ length: 5 }, (_, index) => index < normalizedRating);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: GraceCourtColors.background,
  },
  content: {
    paddingHorizontal: GraceCourtSpacing.screenX,
    paddingTop: GraceCourtSpacing.screenTop,
    paddingBottom: GraceCourtSpacing.screenBottom,
  },
  centeredState: {
    flex: 1,
    paddingHorizontal: GraceCourtSpacing.screenX,
    justifyContent: 'center',
  },
  topRow: {
    marginBottom: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: GraceCourtColors.surface,
    borderRadius: GraceCourtRadius.pill,
    paddingVertical: 10,
    paddingHorizontal: 14,
    ...GraceCourtShadows.subtle,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: GraceCourtColors.accent,
  },
  heroCard: {
    backgroundColor: GraceCourtColors.surface,
    borderRadius: GraceCourtRadius.large,
    padding: 24,
    marginBottom: GraceCourtSpacing.section,
    ...GraceCourtShadows.card,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: GraceCourtColors.tintSurface,
    borderRadius: GraceCourtRadius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 18,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: GraceCourtColors.accent,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: GraceCourtColors.textPrimary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: GraceCourtColors.accentSoft,
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
  listSection: {
    gap: 14,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: GraceCourtColors.surface,
  },
  cardList: {
    gap: GraceCourtSpacing.tight,
  },
  feedbackItemCard: {
    backgroundColor: GraceCourtColors.surface,
    borderRadius: GraceCourtRadius.card,
    padding: GraceCourtSpacing.cardPadding,
    ...GraceCourtShadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  userBlock: {
    flex: 1,
  },
  userEmail: {
    fontSize: 18,
    fontWeight: '800',
    color: GraceCourtColors.textPrimary,
    marginBottom: 5,
  },
  createdAt: {
    fontSize: 13,
    lineHeight: 20,
    color: GraceCourtColors.accentSoft,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: GraceCourtColors.accent,
    borderRadius: GraceCourtRadius.pill,
    paddingVertical: 8,
    paddingHorizontal: 11,
  },
  ratingBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: GraceCourtColors.surface,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  remarksBlock: {
    backgroundColor: GraceCourtColors.tintSurfaceAlt,
    borderWidth: 1,
    borderColor: GraceCourtColors.border,
    borderRadius: GraceCourtRadius.medium,
    padding: 14,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: GraceCourtColors.accentSoft,
    marginBottom: 7,
  },
  remarksText: {
    fontSize: 15,
    lineHeight: 23,
    color: GraceCourtColors.textSecondary,
  },
  emptyRemarksText: {
    color: GraceCourtColors.textMuted,
    fontStyle: 'italic',
  },
  cardActions: {
    marginTop: 16,
  },
  deleteButton: {
    borderRadius: GraceCourtRadius.medium,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    backgroundColor: '#FFF1F1',
    borderWidth: 1,
    borderColor: '#F2C7C7',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A43A3A',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  stateCard: {
    backgroundColor: GraceCourtColors.surface,
    borderRadius: GraceCourtRadius.large,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    ...GraceCourtShadows.card,
  },
  stateCardInline: {
    backgroundColor: GraceCourtColors.surface,
    borderRadius: GraceCourtRadius.card,
    padding: GraceCourtSpacing.cardPadding,
    alignItems: 'center',
    ...GraceCourtShadows.card,
  },
  deniedIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: GraceCourtColors.tintSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  stateTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: GraceCourtColors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  stateText: {
    fontSize: 15,
    lineHeight: 23,
    color: GraceCourtColors.accentSoft,
    textAlign: 'center',
  },
  stateInlineTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GraceCourtColors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  stateInlineText: {
    fontSize: 14,
    lineHeight: 22,
    color: GraceCourtColors.textMuted,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 22,
    backgroundColor: GraceCourtColors.accent,
    borderRadius: GraceCourtRadius.medium,
    paddingVertical: 14,
    paddingHorizontal: 22,
    minWidth: 170,
    alignItems: 'center',
    ...GraceCourtShadows.accent,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: GraceCourtColors.surface,
  },
});
