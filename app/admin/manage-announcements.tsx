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

type AnnouncementRecord = {
  created_at: string;
  date: string;
  id: string;
  message: string;
  title: string;
};

type FeedbackTone = 'error' | 'success';

const emptyForm = {
  date: '',
  message: '',
  title: '',
};

export default function ManageAnnouncementsScreen() {
  const router = useRouter();
  const { authReady, isAdmin, session } = useAuth();
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState<string | null>(null);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [title, setTitle] = useState(emptyForm.title);
  const [message, setMessage] = useState(emptyForm.message);
  const [date, setDate] = useState(emptyForm.date);
  const [listErrorMessage, setListErrorMessage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>('success');

  const resetForm = () => {
    setTitle(emptyForm.title);
    setMessage(emptyForm.message);
    setDate(emptyForm.date);
    setEditingAnnouncementId(null);
  };

  const setFeedback = (tone: FeedbackTone, nextMessage: string) => {
    setFeedbackTone(tone);
    setFeedbackMessage(nextMessage);
  };

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('id, title, message, date, created_at')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setAnnouncements((data ?? []).map((item) => ({
        created_at: item.created_at,
        date: item.date,
        id: String(item.id),
        message: item.message,
        title: item.title,
      })));
      setListErrorMessage('');
    } catch (error) {
      console.error('Failed to load announcements for admin.', error);
      setAnnouncements([]);
      setListErrorMessage('We could not load announcements right now.');
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

    void loadAnnouncements();
  }, [authReady, isAdmin]);

  const validateForm = () => {
    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();
    const trimmedDate = date.trim();

    if (!trimmedTitle || !trimmedMessage || !trimmedDate) {
      setFeedback('error', 'Complete the title, message, and date before saving.');
      return null;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate) || Number.isNaN(Date.parse(`${trimmedDate}T00:00:00`))) {
      setFeedback('error', 'Use the date format YYYY-MM-DD.');
      return null;
    }

    return {
      date: trimmedDate,
      message: trimmedMessage,
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
      if (editingAnnouncementId) {
        const { error } = await supabase
          .from('announcements')
          .update(payload)
          .eq('id', editingAnnouncementId);

        if (error) {
          throw error;
        }

        setFeedback('success', 'Announcement updated successfully.');
      } else {
        const { error } = await supabase.from('announcements').insert(payload);

        if (error) {
          throw error;
        }

        setFeedback('success', 'Announcement created successfully.');
      }

      resetForm();
      await loadAnnouncements();
    } catch (error) {
      console.error('Failed to save announcement.', error);
      setFeedback('error', getFriendlyActionErrorMessage(error, 'We could not save this announcement right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditingAnnouncement = (announcement: AnnouncementRecord) => {
    setEditingAnnouncementId(announcement.id);
    setTitle(announcement.title);
    setMessage(announcement.message);
    setDate(announcement.date);
    setFeedback('success', 'Editing announcement. Update the fields and save when ready.');
  };

  const handleDeleteAnnouncement = (announcement: AnnouncementRecord) => {
    Alert.alert(
      'Delete announcement?',
      'This announcement will be removed from the app for members and admins.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteAnnouncement(announcement.id);
          },
        },
      ]
    );
  };

  const deleteAnnouncement = async (announcementId: string) => {
    if (deletingAnnouncementId) {
      return;
    }

    setDeletingAnnouncementId(announcementId);
    setFeedbackMessage('');

    try {
      const { error } = await supabase.from('announcements').delete().eq('id', announcementId);

      if (error) {
        throw error;
      }

      if (editingAnnouncementId === announcementId) {
        resetForm();
      }

      setFeedback('success', 'Announcement deleted successfully.');
      await loadAnnouncements();
    } catch (error) {
      console.error('Failed to delete announcement.', error);
      setFeedback('error', getFriendlyActionErrorMessage(error, 'We could not delete this announcement right now.'));
    } finally {
      setDeletingAnnouncementId(null);
    }
  };

  if (!authReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredState}>
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Loading admin tools...</Text>
            <Text style={styles.stateText}>
              We are checking your access before opening announcement management.
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
              Only users with the admin role can manage announcements.
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
            <Text style={styles.title}>Manage Announcements</Text>
            <Text style={styles.subtitle}>
              Create, update, and remove announcement content without affecting the member reading
              experience.
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.sectionTitle}>
                {editingAnnouncementId ? 'Edit Announcement' : 'Create Announcement'}
              </Text>
              {editingAnnouncementId ? (
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
                  placeholder="Sunday Thanksgiving Service"
                  placeholderTextColor={GraceCourtColors.textMuted}
                  style={styles.input}
                  value={title}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Message</Text>
                <TextInput
                  multiline
                  onChangeText={setMessage}
                  placeholder="Share the full announcement message here."
                  placeholderTextColor={GraceCourtColors.textMuted}
                  scrollEnabled={false}
                  style={[styles.input, styles.messageInput]}
                  textAlignVertical="top"
                  value={message}
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
                  ? editingAnnouncementId
                    ? 'Updating...'
                    : 'Creating...'
                  : editingAnnouncementId
                    ? 'Update Announcement'
                    : 'Create Announcement'}
              </Text>
            </InteractivePressable>
          </View>

          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>Published Announcements</Text>

            {isLoading ? (
              <View style={styles.stateCardInline}>
                <Text style={styles.stateInlineText}>Loading announcements...</Text>
              </View>
            ) : listErrorMessage ? (
              <View style={styles.stateCardInline}>
                <Text style={styles.stateInlineTitle}>Announcements unavailable</Text>
                <Text style={styles.stateInlineText}>{listErrorMessage}</Text>
              </View>
            ) : announcements.length === 0 ? (
              <View style={styles.stateCardInline}>
                <Text style={styles.stateInlineTitle}>No announcements yet</Text>
                <Text style={styles.stateInlineText}>
                  Your first admin announcement will appear here right after you create it.
                </Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {announcements.map((announcement) => {
                  const isDeleting = deletingAnnouncementId === announcement.id;

                  return (
                    <View key={announcement.id} style={styles.announcementCard}>
                      <View style={styles.dateChip}>
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color={GraceCourtColors.accent}
                        />
                        <Text style={styles.dateChipText}>
                          {formatAnnouncementDate(announcement.date)}
                        </Text>
                      </View>
                      <Text style={styles.announcementTitle}>{announcement.title}</Text>
                      <Text style={styles.announcementMessage}>
                        {getMessagePreview(announcement.message)}
                      </Text>

                      <View style={styles.cardActions}>
                        <InteractivePressable
                          disabled={isSubmitting || isDeleting}
                          onPress={() => {
                            startEditingAnnouncement(announcement);
                          }}
                          style={styles.secondaryButton}>
                          <Text style={styles.secondaryButtonText}>Edit</Text>
                        </InteractivePressable>

                        <InteractivePressable
                          disabled={isDeleting}
                          onPress={() => {
                            handleDeleteAnnouncement(announcement);
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

function formatAnnouncementDate(dateValue: string) {
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

function getMessagePreview(messageValue: string) {
  const trimmedMessage = messageValue.trim();

  if (trimmedMessage.length <= 120) {
    return trimmedMessage;
  }

  return `${trimmedMessage.slice(0, 117).trimEnd()}...`;
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
  messageInput: {
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
  announcementCard: {
    backgroundColor: GraceCourtColors.surface,
    borderRadius: GraceCourtRadius.card,
    padding: GraceCourtSpacing.cardPadding,
    ...GraceCourtShadows.card,
  },
  dateChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GraceCourtColors.tintSurface,
    borderRadius: GraceCourtRadius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: GraceCourtColors.accentSoft,
  },
  announcementTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: GraceCourtColors.textPrimary,
    marginBottom: 10,
  },
  announcementMessage: {
    fontSize: 15,
    lineHeight: 23,
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
