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

type PrayerRequestRecord = {
  category: string;
  contact: string | null;
  created_at: string;
  full_name: string;
  id: string;
  is_anonymous: boolean;
  message: string;
};

type FeedbackTone = 'error' | 'success';

export default function ViewPrayerRequestsScreen() {
  const router = useRouter();
  const { authReady, isAdmin, session } = useAuth();
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingPrayerRequestId, setDeletingPrayerRequestId] = useState<string | null>(null);
  const [listErrorMessage, setListErrorMessage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>('success');

  const setFeedback = (tone: FeedbackTone, nextMessage: string) => {
    setFeedbackTone(tone);
    setFeedbackMessage(nextMessage);
  };

  const loadPrayerRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('prayer_requests')
        .select('id, full_name, contact, category, message, is_anonymous, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setPrayerRequests(
        (data ?? []).map((item) => ({
          category: item.category,
          contact: item.contact ?? null,
          created_at: item.created_at,
          full_name: item.full_name,
          id: String(item.id),
          is_anonymous: item.is_anonymous,
          message: item.message,
        }))
      );
      setListErrorMessage('');
    } catch (error) {
      console.error('Failed to load prayer requests for admin.', error);
      setPrayerRequests([]);
      setListErrorMessage('We could not load prayer requests right now.');
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

    void loadPrayerRequests();
  }, [authReady, isAdmin]);

  const handleDeletePrayerRequest = (prayerRequest: PrayerRequestRecord) => {
    Alert.alert(
      'Delete prayer request?',
      'This prayer request will be permanently removed from the admin view.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deletePrayerRequest(prayerRequest.id);
          },
        },
      ]
    );
  };

  const deletePrayerRequest = async (prayerRequestId: string) => {
    if (deletingPrayerRequestId) {
      return;
    }

    setDeletingPrayerRequestId(prayerRequestId);
    setFeedbackMessage('');

    try {
      const { error } = await supabase
        .from('prayer_requests')
        .delete()
        .eq('id', prayerRequestId);

      if (error) {
        throw error;
      }

      setFeedback('success', 'Prayer request deleted successfully.');
      await loadPrayerRequests();
    } catch (error) {
      console.error('Failed to delete prayer request.', error);
      setFeedback(
        'error',
        error instanceof Error
          ? error.message
          : 'We could not delete this prayer request right now.'
      );
    } finally {
      setDeletingPrayerRequestId(null);
    }
  };

  if (!authReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredState}>
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Loading admin tools...</Text>
            <Text style={styles.stateText}>
              We are checking your access before opening prayer request management.
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
              Only users with the admin role can view prayer requests.
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
            <Text style={styles.title}>View Prayer Requests</Text>
            <Text style={styles.subtitle}>
              Review submitted prayer requests in one place while keeping member submission
              unchanged.
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
            <Text style={styles.sectionTitle}>Submitted Requests</Text>

            {isLoading ? (
              <View style={styles.stateCardInline}>
                <Text style={styles.stateInlineText}>Loading prayer requests...</Text>
              </View>
            ) : listErrorMessage ? (
              <View style={styles.stateCardInline}>
                <Text style={styles.stateInlineTitle}>Prayer requests unavailable</Text>
                <Text style={styles.stateInlineText}>{listErrorMessage}</Text>
              </View>
            ) : prayerRequests.length === 0 ? (
              <View style={styles.stateCardInline}>
                <Text style={styles.stateInlineTitle}>No prayer requests yet</Text>
                <Text style={styles.stateInlineText}>
                  Submitted requests will appear here as soon as members send them in.
                </Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {prayerRequests.map((prayerRequest) => {
                  const isDeleting = deletingPrayerRequestId === prayerRequest.id;
                  const displayName = prayerRequest.is_anonymous
                    ? 'Anonymous'
                    : prayerRequest.full_name;

                  return (
                    <View key={prayerRequest.id} style={styles.requestCard}>
                      <View style={styles.cardHeader}>
                        <View style={styles.nameBlock}>
                          <Text style={styles.requestName}>{displayName}</Text>
                          <Text style={styles.requestDate}>
                            {formatCreatedAt(prayerRequest.created_at)}
                          </Text>
                        </View>
                        {prayerRequest.is_anonymous ? (
                          <View style={styles.anonymousBadge}>
                            <Text style={styles.anonymousBadgeText}>Anonymous</Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.metaStack}>
                        <View style={styles.metaRow}>
                          <View style={styles.metaIconWrap}>
                            <Ionicons name="layers-outline" size={16} color={GraceCourtColors.accent} />
                          </View>
                          <View style={styles.metaTextWrap}>
                            <Text style={styles.metaLabel}>Category</Text>
                            <Text style={styles.metaValue}>{prayerRequest.category}</Text>
                          </View>
                        </View>

                        {prayerRequest.contact ? (
                          <View style={styles.metaRow}>
                            <View style={styles.metaIconWrap}>
                              <Ionicons name="call-outline" size={16} color={GraceCourtColors.accent} />
                            </View>
                            <View style={styles.metaTextWrap}>
                              <Text style={styles.metaLabel}>Contact</Text>
                              <Text style={styles.metaValue}>{prayerRequest.contact}</Text>
                            </View>
                          </View>
                        ) : null}

                        <View style={styles.metaRow}>
                          <View style={styles.metaIconWrap}>
                            <Ionicons
                              name="document-text-outline"
                              size={16}
                              color={GraceCourtColors.accent}
                            />
                          </View>
                          <View style={styles.metaTextWrap}>
                            <Text style={styles.metaLabel}>Message</Text>
                            <Text style={styles.metaValue}>{prayerRequest.message}</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.cardActions}>
                        <InteractivePressable
                          disabled={isDeleting}
                          onPress={() => {
                            handleDeletePrayerRequest(prayerRequest);
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
  requestCard: {
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
    marginBottom: 16,
  },
  nameBlock: {
    flex: 1,
  },
  requestName: {
    fontSize: 20,
    fontWeight: '800',
    color: GraceCourtColors.textPrimary,
    marginBottom: 6,
  },
  requestDate: {
    fontSize: 13,
    lineHeight: 20,
    color: GraceCourtColors.accentSoft,
  },
  anonymousBadge: {
    backgroundColor: GraceCourtColors.tintSurface,
    borderRadius: GraceCourtRadius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  anonymousBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: GraceCourtColors.accent,
  },
  metaStack: {
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  metaIconWrap: {
    width: 38,
    height: 38,
    borderRadius: GraceCourtRadius.icon,
    backgroundColor: GraceCourtColors.tintSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaTextWrap: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: GraceCourtColors.accentSoft,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 15,
    lineHeight: 22,
    color: GraceCourtColors.textSecondary,
  },
  cardActions: {
    marginTop: 18,
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
