import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FadeInView } from '@/components/fade-in-view';
import { InteractivePressable } from '@/components/interactive-pressable';
import { KeyboardSafeScrollView } from '@/components/keyboard-safe-scroll-view';
import {
  GraceCourtColors,
  GraceCourtRadius,
  GraceCourtShadows,
  GraceCourtSpacing,
} from '@/constants/gracecourt-ui';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { getFriendlyActionErrorMessage } from '@/lib/user-facing-error';

type SermonRecord = {
  created_at: string;
  date: string;
  id: string;
  media_url: string | null;
  speaker: string | null;
  title: string;
};

type FeedbackTone = 'error' | 'success';

const emptyForm = {
  date: '',
  mediaUrl: '',
  speaker: '',
  title: '',
};

export default function ManageSermonsScreen() {
  const router = useRouter();
  const { authReady, isAdmin, session } = useAuth();
  const [sermons, setSermons] = useState<SermonRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingSermonId, setDeletingSermonId] = useState<string | null>(null);
  const [editingSermonId, setEditingSermonId] = useState<string | null>(null);
  const [title, setTitle] = useState(emptyForm.title);
  const [speaker, setSpeaker] = useState(emptyForm.speaker);
  const [date, setDate] = useState(emptyForm.date);
  const [mediaUrl, setMediaUrl] = useState(emptyForm.mediaUrl);
  const [listErrorMessage, setListErrorMessage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>('success');

  const resetForm = () => {
    setTitle(emptyForm.title);
    setSpeaker(emptyForm.speaker);
    setDate(emptyForm.date);
    setMediaUrl(emptyForm.mediaUrl);
    setEditingSermonId(null);
  };

  const setFeedback = (tone: FeedbackTone, nextMessage: string) => {
    setFeedbackTone(tone);
    setFeedbackMessage(nextMessage);
  };

  const loadSermons = async () => {
    try {
      const { data, error } = await supabase
        .from('sermons')
        .select('id, title, speaker, date, media_url, created_at')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setSermons(
        (data ?? []).map((item) => ({
          created_at: item.created_at,
          date: item.date,
          id: String(item.id),
          media_url: item.media_url ?? null,
          speaker: item.speaker ?? null,
          title: item.title,
        }))
      );
      setListErrorMessage('');
    } catch (error) {
      console.error('Failed to load sermons for admin.', error);
      setSermons([]);
      setListErrorMessage('We could not load sermons right now.');
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

    void loadSermons();
  }, [authReady, isAdmin]);

  const validateForm = () => {
    const trimmedTitle = title.trim();
    const trimmedSpeaker = speaker.trim();
    const trimmedDate = date.trim();
    const trimmedMediaUrl = mediaUrl.trim();

    if (!trimmedTitle || !trimmedSpeaker || !trimmedDate) {
      setFeedback('error', 'Complete the title, speaker, and date before saving.');
      return null;
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate) ||
      Number.isNaN(Date.parse(`${trimmedDate}T00:00:00`))
    ) {
      setFeedback('error', 'Use the date format YYYY-MM-DD.');
      return null;
    }

    return {
      date: trimmedDate,
      media_url: trimmedMediaUrl || null,
      speaker: trimmedSpeaker,
      title: trimmedTitle,
    };
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    const payload = validateForm();

    if (!payload) {
      return;
    }

    setIsSubmitting(true);
    setFeedbackMessage('');

    try {
      if (editingSermonId) {
        const { error } = await supabase.from('sermons').update(payload).eq('id', editingSermonId);

        if (error) {
          throw error;
        }

        setFeedback('success', 'Sermon updated successfully.');
      } else {
        const { error } = await supabase.from('sermons').insert(payload);

        if (error) {
          throw error;
        }

        setFeedback('success', 'Sermon created successfully.');
      }

      resetForm();
      await loadSermons();
    } catch (error) {
      console.error('Failed to save sermon.', error);
      setFeedback('error', getFriendlyActionErrorMessage(error, 'We could not save this sermon right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditingSermon = (sermon: SermonRecord) => {
    setEditingSermonId(sermon.id);
    setTitle(sermon.title);
    setSpeaker(sermon.speaker ?? '');
    setDate(sermon.date);
    setMediaUrl(sermon.media_url ?? '');
    setFeedback('success', 'Editing sermon. Update the fields and save when ready.');
  };

  const handleDeleteSermon = (sermon: SermonRecord) => {
    Alert.alert('Delete sermon?', 'This sermon will be removed from the app for members and admins.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteSermon(sermon.id);
        },
      },
    ]);
  };

  const deleteSermon = async (sermonId: string) => {
    if (deletingSermonId) {
      return;
    }

    setDeletingSermonId(sermonId);
    setFeedbackMessage('');

    try {
      const { error } = await supabase.from('sermons').delete().eq('id', sermonId);

      if (error) {
        throw error;
      }

      if (editingSermonId === sermonId) {
        resetForm();
      }

      setFeedback('success', 'Sermon deleted successfully.');
      await loadSermons();
    } catch (error) {
      console.error('Failed to delete sermon.', error);
      setFeedback('error', getFriendlyActionErrorMessage(error, 'We could not delete this sermon right now.'));
    } finally {
      setDeletingSermonId(null);
    }
  };

  if (!authReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredState}>
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Loading admin tools...</Text>
            <Text style={styles.stateText}>
              We are checking your access before opening sermon management.
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
              Only users with the admin role can manage sermons.
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
      <KeyboardSafeScrollView contentContainerStyle={styles.content}>
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
            <Text style={styles.title}>Manage Sermons</Text>
            <Text style={styles.subtitle}>
              Create, update, and remove sermons while keeping member listening and playback
              experiences untouched.
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.sectionTitle}>
                {editingSermonId ? 'Edit Sermon' : 'Create Sermon'}
              </Text>
              {editingSermonId ? (
                <InteractivePressable onPress={resetForm} style={styles.secondaryChip}>
                  <Text style={styles.secondaryChipText}>Cancel Edit</Text>
                </InteractivePressable>
              ) : null}
            </View>

            <View style={styles.formFields}>
              <View style={styles.field}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  onChangeText={setTitle}
                  placeholder="The Power of Grace"
                  placeholderTextColor={GraceCourtColors.textMuted}
                  style={styles.input}
                  value={title}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Speaker</Text>
                <TextInput
                  onChangeText={setSpeaker}
                  placeholder="Pastor Tosin Tope-Babalola"
                  placeholderTextColor={GraceCourtColors.textMuted}
                  style={styles.input}
                  value={speaker}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Date</Text>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={GraceCourtColors.textMuted}
                  style={styles.input}
                  value={date}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Media URL</Text>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setMediaUrl}
                  placeholder="https://..."
                  placeholderTextColor={GraceCourtColors.textMuted}
                  style={styles.input}
                  value={mediaUrl}
                />
              </View>
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

            <InteractivePressable
              disabled={isSubmitting}
              onPress={() => {
                void handleSubmit();
              }}
              style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}>
              <Text style={styles.primaryButtonText}>
                {isSubmitting
                  ? editingSermonId
                    ? 'Updating...'
                    : 'Creating...'
                  : editingSermonId
                    ? 'Update Sermon'
                    : 'Create Sermon'}
              </Text>
            </InteractivePressable>
          </View>

          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>Published Sermons</Text>

            {isLoading ? (
              <View style={styles.stateCardInline}>
                <Text style={styles.stateInlineText}>Loading sermons...</Text>
              </View>
            ) : listErrorMessage ? (
              <View style={styles.stateCardInline}>
                <Text style={styles.stateInlineTitle}>Sermons unavailable</Text>
                <Text style={styles.stateInlineText}>{listErrorMessage}</Text>
              </View>
            ) : sermons.length === 0 ? (
              <View style={styles.stateCardInline}>
                <Text style={styles.stateInlineTitle}>No sermons yet</Text>
                <Text style={styles.stateInlineText}>
                  Your first admin sermon will appear here right after you create it.
                </Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {sermons.map((sermon) => {
                  const isDeleting = deletingSermonId === sermon.id;

                  return (
                    <View key={sermon.id} style={styles.sermonCard}>
                      <Text style={styles.sermonTitle}>{sermon.title}</Text>

                      <View style={styles.metaStack}>
                        <View style={styles.metaRow}>
                          <View style={styles.metaIconWrap}>
                            <Ionicons name="person-outline" size={16} color={GraceCourtColors.accent} />
                          </View>
                          <View style={styles.metaTextWrap}>
                            <Text style={styles.metaLabel}>Speaker</Text>
                            <Text style={styles.metaValue}>{sermon.speaker ?? 'Not provided'}</Text>
                          </View>
                        </View>

                        <View style={styles.metaRow}>
                          <View style={styles.metaIconWrap}>
                            <Ionicons
                              name="calendar-outline"
                              size={16}
                              color={GraceCourtColors.accent}
                            />
                          </View>
                          <View style={styles.metaTextWrap}>
                            <Text style={styles.metaLabel}>Date</Text>
                            <Text style={styles.metaValue}>{formatSermonDate(sermon.date)}</Text>
                          </View>
                        </View>

                        <View style={styles.metaRow}>
                          <View style={styles.metaIconWrap}>
                            <Ionicons name="link-outline" size={16} color={GraceCourtColors.accent} />
                          </View>
                          <View style={styles.metaTextWrap}>
                            <Text style={styles.metaLabel}>Media URL</Text>
                            <Text style={styles.metaValue}>
                              {getMediaPreview(sermon.media_url)}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.cardActions}>
                        <InteractivePressable
                          disabled={isSubmitting || isDeleting}
                          onPress={() => {
                            startEditingSermon(sermon);
                          }}
                          style={styles.secondaryButton}>
                          <Text style={styles.secondaryButtonText}>Edit</Text>
                        </InteractivePressable>

                        <InteractivePressable
                          disabled={isDeleting}
                          onPress={() => {
                            handleDeleteSermon(sermon);
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
      </KeyboardSafeScrollView>
    </SafeAreaView>
  );
}

function formatSermonDate(dateValue: string) {
  const parsedDate = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(parsedDate);
}

function getMediaPreview(mediaUrl: string | null) {
  if (!mediaUrl) {
    return 'No media link yet';
  }

  if (mediaUrl.length <= 48) {
    return mediaUrl;
  }

  return `${mediaUrl.slice(0, 45).trimEnd()}...`;
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
  formCard: {
    backgroundColor: GraceCourtColors.surface,
    borderRadius: GraceCourtRadius.large,
    padding: 22,
    marginBottom: GraceCourtSpacing.section,
    ...GraceCourtShadows.card,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: GraceCourtColors.textPrimary,
  },
  secondaryChip: {
    borderWidth: 1,
    borderColor: GraceCourtColors.border,
    borderRadius: GraceCourtRadius.pill,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  secondaryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: GraceCourtColors.accent,
  },
  formFields: {
    gap: 16,
  },
  field: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: GraceCourtColors.textPrimary,
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: GraceCourtColors.border,
    borderRadius: GraceCourtRadius.medium,
    backgroundColor: GraceCourtColors.tintSurfaceAlt,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: GraceCourtColors.textPrimary,
  },
  feedbackCard: {
    borderRadius: GraceCourtRadius.medium,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 18,
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
  primaryButton: {
    marginTop: 2,
    backgroundColor: GraceCourtColors.accent,
    borderRadius: GraceCourtRadius.medium,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    ...GraceCourtShadows.accent,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: GraceCourtColors.surface,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  listSection: {
    gap: 14,
  },
  cardList: {
    gap: GraceCourtSpacing.tight,
  },
  sermonCard: {
    backgroundColor: GraceCourtColors.surface,
    borderRadius: GraceCourtRadius.card,
    padding: GraceCourtSpacing.cardPadding,
    ...GraceCourtShadows.card,
  },
  sermonTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: GraceCourtColors.textPrimary,
    marginBottom: 16,
  },
  metaStack: {
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: GraceCourtColors.border,
    borderRadius: GraceCourtRadius.medium,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    backgroundColor: GraceCourtColors.tintSurfaceAlt,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: GraceCourtColors.accent,
  },
  deleteButton: {
    flex: 1,
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
});
