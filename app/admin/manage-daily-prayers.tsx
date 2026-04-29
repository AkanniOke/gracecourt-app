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

type PrayerRecord = {
  bible_verse: string | null;
  content: string;
  created_at: string;
  date: string;
  id: string;
  title: string;
};

type FeedbackTone = 'error' | 'success';

const emptyForm = {
  bibleVerse: '',
  content: '',
  date: '',
  title: '',
};

export default function ManageDailyPrayersScreen() {
  const router = useRouter();
  const { authReady, isAdmin, session } = useAuth();
  const [prayers, setPrayers] = useState<PrayerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingPrayerId, setDeletingPrayerId] = useState<string | null>(null);
  const [editingPrayerId, setEditingPrayerId] = useState<string | null>(null);
  const [title, setTitle] = useState(emptyForm.title);
  const [content, setContent] = useState(emptyForm.content);
  const [bibleVerse, setBibleVerse] = useState(emptyForm.bibleVerse);
  const [date, setDate] = useState(emptyForm.date);
  const [listErrorMessage, setListErrorMessage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>('success');

  const resetForm = () => {
    setTitle(emptyForm.title);
    setContent(emptyForm.content);
    setBibleVerse(emptyForm.bibleVerse);
    setDate(emptyForm.date);
    setEditingPrayerId(null);
  };

  const setFeedback = (tone: FeedbackTone, nextMessage: string) => {
    setFeedbackTone(tone);
    setFeedbackMessage(nextMessage);
  };

  const loadPrayers = async () => {
    try {
      const { data, error } = await supabase
        .from('prayers')
        .select('id, title, content, bible_verse, date, created_at')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setPrayers(
        (data ?? []).map((item) => ({
          bible_verse: item.bible_verse ?? null,
          content: item.content,
          created_at: item.created_at,
          date: item.date,
          id: String(item.id),
          title: item.title,
        }))
      );
      setListErrorMessage('');
    } catch (error) {
      console.error('Failed to load prayers for admin.', error);
      setPrayers([]);
      setListErrorMessage('We could not load daily prayers right now.');
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

    void loadPrayers();
  }, [authReady, isAdmin]);

  const validateForm = () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const trimmedBibleVerse = bibleVerse.trim();
    const trimmedDate = date.trim();

    if (!trimmedTitle || !trimmedContent || !trimmedDate) {
      setFeedback('error', 'Complete the title, content, and date before saving.');
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
      bible_verse: trimmedBibleVerse || null,
      content: trimmedContent,
      date: trimmedDate,
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
      if (editingPrayerId) {
        const { error } = await supabase.from('prayers').update(payload).eq('id', editingPrayerId);

        if (error) {
          throw error;
        }

        setFeedback('success', 'Daily prayer updated successfully.');
      } else {
        const { error } = await supabase.from('prayers').insert(payload);

        if (error) {
          throw error;
        }

        setFeedback('success', 'Daily prayer created successfully.');
      }

      resetForm();
      await loadPrayers();
    } catch (error) {
      console.error('Failed to save daily prayer.', error);
      setFeedback('error', getFriendlyActionErrorMessage(error, 'We could not save this daily prayer right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditingPrayer = (prayer: PrayerRecord) => {
    setEditingPrayerId(prayer.id);
    setTitle(prayer.title);
    setContent(prayer.content);
    setBibleVerse(prayer.bible_verse ?? '');
    setDate(prayer.date);
    setFeedback('success', 'Editing daily prayer. Update the fields and save when ready.');
  };

  const handleDeletePrayer = (prayer: PrayerRecord) => {
    Alert.alert(
      'Delete daily prayer?',
      'This prayer will be removed from the app for members and admins.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deletePrayer(prayer.id);
          },
        },
      ]
    );
  };

  const deletePrayer = async (prayerId: string) => {
    if (deletingPrayerId) {
      return;
    }

    setDeletingPrayerId(prayerId);
    setFeedbackMessage('');

    try {
      const { error } = await supabase.from('prayers').delete().eq('id', prayerId);

      if (error) {
        throw error;
      }

      if (editingPrayerId === prayerId) {
        resetForm();
      }

      setFeedback('success', 'Daily prayer deleted successfully.');
      await loadPrayers();
    } catch (error) {
      console.error('Failed to delete daily prayer.', error);
      setFeedback('error', getFriendlyActionErrorMessage(error, 'We could not delete this daily prayer right now.'));
    } finally {
      setDeletingPrayerId(null);
    }
  };

  if (!authReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredState}>
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Loading admin tools...</Text>
            <Text style={styles.stateText}>
              We are checking your access before opening daily prayer management.
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
              Only users with the admin role can manage daily prayers.
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
            <Text style={styles.title}>Manage Daily Prayers</Text>
            <Text style={styles.subtitle}>
              Create, update, and remove daily prayers while leaving the member-facing reading
              experience unchanged.
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.sectionTitle}>
                {editingPrayerId ? 'Edit Daily Prayer' : 'Create Daily Prayer'}
              </Text>
              {editingPrayerId ? (
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
                  placeholder="A Prayer for Strength"
                  placeholderTextColor={GraceCourtColors.textMuted}
                  style={styles.input}
                  value={title}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Content</Text>
                <TextInput
                  multiline
                  onChangeText={setContent}
                  placeholder="Write the full daily prayer here."
                  placeholderTextColor={GraceCourtColors.textMuted}
                  scrollEnabled={false}
                  style={[styles.input, styles.contentInput]}
                  textAlignVertical="top"
                  value={content}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Bible Verse</Text>
                <TextInput
                  onChangeText={setBibleVerse}
                  placeholder="Philippians 4:13"
                  placeholderTextColor={GraceCourtColors.textMuted}
                  style={styles.input}
                  value={bibleVerse}
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
                  ? editingPrayerId
                    ? 'Updating...'
                    : 'Creating...'
                  : editingPrayerId
                    ? 'Update Daily Prayer'
                    : 'Create Daily Prayer'}
              </Text>
            </InteractivePressable>
          </View>

          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>Published Daily Prayers</Text>

            {isLoading ? (
              <View style={styles.stateCardInline}>
                <Text style={styles.stateInlineText}>Loading daily prayers...</Text>
              </View>
            ) : listErrorMessage ? (
              <View style={styles.stateCardInline}>
                <Text style={styles.stateInlineTitle}>Daily prayers unavailable</Text>
                <Text style={styles.stateInlineText}>{listErrorMessage}</Text>
              </View>
            ) : prayers.length === 0 ? (
              <View style={styles.stateCardInline}>
                <Text style={styles.stateInlineTitle}>No daily prayers yet</Text>
                <Text style={styles.stateInlineText}>
                  Your first admin prayer will appear here right after you create it.
                </Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {prayers.map((prayer) => {
                  const isDeleting = deletingPrayerId === prayer.id;

                  return (
                    <View key={prayer.id} style={styles.prayerCard}>
                      <Text style={styles.prayerTitle}>{prayer.title}</Text>

                      <View style={styles.metaStack}>
                        <View style={styles.metaRow}>
                          <View style={styles.metaIconWrap}>
                            <Ionicons name="book-outline" size={16} color={GraceCourtColors.accent} />
                          </View>
                          <View style={styles.metaTextWrap}>
                            <Text style={styles.metaLabel}>Bible Verse</Text>
                            <Text style={styles.metaValue}>
                              {prayer.bible_verse ?? 'No verse added yet'}
                            </Text>
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
                            <Text style={styles.metaValue}>{formatPrayerDate(prayer.date)}</Text>
                          </View>
                        </View>

                        <View style={styles.metaRow}>
                          <View style={styles.metaIconWrap}>
                            <Ionicons
                              name="document-text-outline"
                              size={16}
                              color={GraceCourtColors.accent}
                            />
                          </View>
                          <View style={styles.metaTextWrap}>
                            <Text style={styles.metaLabel}>Content</Text>
                            <Text style={styles.metaValue}>{getContentPreview(prayer.content)}</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.cardActions}>
                        <InteractivePressable
                          disabled={isSubmitting || isDeleting}
                          onPress={() => {
                            startEditingPrayer(prayer);
                          }}
                          style={styles.secondaryButton}>
                          <Text style={styles.secondaryButtonText}>Edit</Text>
                        </InteractivePressable>

                        <InteractivePressable
                          disabled={isDeleting}
                          onPress={() => {
                            handleDeletePrayer(prayer);
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

function formatPrayerDate(dateValue: string) {
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

function getContentPreview(contentValue: string) {
  const trimmedContent = contentValue.trim();

  if (trimmedContent.length <= 120) {
    return trimmedContent;
  }

  return `${trimmedContent.slice(0, 117).trimEnd()}...`;
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
  contentInput: {
    minHeight: 128,
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
  prayerCard: {
    backgroundColor: GraceCourtColors.surface,
    borderRadius: GraceCourtRadius.card,
    padding: GraceCourtSpacing.cardPadding,
    ...GraceCourtShadows.card,
  },
  prayerTitle: {
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
