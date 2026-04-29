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

type ChurchEventRecord = {
  created_at: string;
  date: string;
  id: string;
  location: string;
  time: string;
  title: string;
};

type FeedbackTone = 'error' | 'success';

const emptyForm = {
  date: '',
  location: '',
  time: '',
  title: '',
};

export default function ManageEventsScreen() {
  const router = useRouter();
  const { authReady, isAdmin, session } = useAuth();
  const [events, setEvents] = useState<ChurchEventRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [title, setTitle] = useState(emptyForm.title);
  const [date, setDate] = useState(emptyForm.date);
  const [time, setTime] = useState(emptyForm.time);
  const [location, setLocation] = useState(emptyForm.location);
  const [listErrorMessage, setListErrorMessage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>('success');

  const resetForm = () => {
    setTitle(emptyForm.title);
    setDate(emptyForm.date);
    setTime(emptyForm.time);
    setLocation(emptyForm.location);
    setEditingEventId(null);
  };

  const setFeedback = (tone: FeedbackTone, nextMessage: string) => {
    setFeedbackTone(tone);
    setFeedbackMessage(nextMessage);
  };

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, date, time, location, created_at')
        .order('date', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setEvents(
        (data ?? []).map((item) => ({
          created_at: item.created_at,
          date: item.date,
          id: String(item.id),
          location: item.location,
          time: item.time,
          title: item.title,
        }))
      );
      setListErrorMessage('');
    } catch (error) {
      console.error('Failed to load events for admin.', error);
      setEvents([]);
      setListErrorMessage('We could not load events right now.');
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

    void loadEvents();
  }, [authReady, isAdmin]);

  const validateForm = () => {
    const trimmedTitle = title.trim();
    const trimmedDate = date.trim();
    const trimmedTime = time.trim();
    const trimmedLocation = location.trim();

    if (!trimmedTitle || !trimmedDate || !trimmedTime || !trimmedLocation) {
      setFeedback('error', 'Complete the title, date, time, and location before saving.');
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
      location: trimmedLocation,
      time: trimmedTime,
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
      if (editingEventId) {
        const { error } = await supabase.from('events').update(payload).eq('id', editingEventId);

        if (error) {
          throw error;
        }

        setFeedback('success', 'Event updated successfully.');
      } else {
        const { error } = await supabase.from('events').insert(payload);

        if (error) {
          throw error;
        }

        setFeedback('success', 'Event created successfully.');
      }

      resetForm();
      await loadEvents();
    } catch (error) {
      console.error('Failed to save event.', error);
      setFeedback('error', getFriendlyActionErrorMessage(error, 'We could not save this event right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditingEvent = (event: ChurchEventRecord) => {
    setEditingEventId(event.id);
    setTitle(event.title);
    setDate(event.date);
    setTime(event.time);
    setLocation(event.location);
    setFeedback('success', 'Editing event. Update the fields and save when ready.');
  };

  const handleDeleteEvent = (event: ChurchEventRecord) => {
    Alert.alert('Delete event?', 'This event will be removed from the app for members and admins.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteEvent(event.id);
        },
      },
    ]);
  };

  const deleteEvent = async (eventId: string) => {
    if (deletingEventId) {
      return;
    }

    setDeletingEventId(eventId);
    setFeedbackMessage('');

    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId);

      if (error) {
        throw error;
      }

      if (editingEventId === eventId) {
        resetForm();
      }

      setFeedback('success', 'Event deleted successfully.');
      await loadEvents();
    } catch (error) {
      console.error('Failed to delete event.', error);
      setFeedback('error', getFriendlyActionErrorMessage(error, 'We could not delete this event right now.'));
    } finally {
      setDeletingEventId(null);
    }
  };

  if (!authReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredState}>
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Loading admin tools...</Text>
            <Text style={styles.stateText}>
              We are checking your access before opening event management.
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
              Only users with the admin role can manage events.
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
            <Text style={styles.title}>Manage Events</Text>
            <Text style={styles.subtitle}>
              Create, update, and remove event details while keeping the member Events screen
              unchanged.
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.sectionTitle}>
                {editingEventId ? 'Edit Event' : 'Create Event'}
              </Text>
              {editingEventId ? (
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
                  placeholder="Workers Prayer Meeting"
                  placeholderTextColor={GraceCourtColors.textMuted}
                  style={styles.input}
                  value={title}
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
                <Text style={styles.label}>Time</Text>
                <TextInput
                  onChangeText={setTime}
                  placeholder="6:00 PM"
                  placeholderTextColor={GraceCourtColors.textMuted}
                  style={styles.input}
                  value={time}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  onChangeText={setLocation}
                  placeholder="GraceCourt Auditorium"
                  placeholderTextColor={GraceCourtColors.textMuted}
                  style={styles.input}
                  value={location}
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
                  ? editingEventId
                    ? 'Updating...'
                    : 'Creating...'
                  : editingEventId
                    ? 'Update Event'
                    : 'Create Event'}
              </Text>
            </InteractivePressable>
          </View>

          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>Published Events</Text>

            {isLoading ? (
              <View style={styles.stateCardInline}>
                <Text style={styles.stateInlineText}>Loading events...</Text>
              </View>
            ) : listErrorMessage ? (
              <View style={styles.stateCardInline}>
                <Text style={styles.stateInlineTitle}>Events unavailable</Text>
                <Text style={styles.stateInlineText}>{listErrorMessage}</Text>
              </View>
            ) : events.length === 0 ? (
              <View style={styles.stateCardInline}>
                <Text style={styles.stateInlineTitle}>No events yet</Text>
                <Text style={styles.stateInlineText}>
                  Your first admin event will appear here right after you create it.
                </Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {events.map((event) => {
                  const isDeleting = deletingEventId === event.id;

                  return (
                    <View key={event.id} style={styles.eventCard}>
                      <Text style={styles.eventTitle}>{event.title}</Text>

                      <View style={styles.metaStack}>
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
                            <Text style={styles.metaValue}>{formatEventDate(event.date)}</Text>
                          </View>
                        </View>

                        <View style={styles.metaRow}>
                          <View style={styles.metaIconWrap}>
                            <Ionicons
                              name="time-outline"
                              size={16}
                              color={GraceCourtColors.accent}
                            />
                          </View>
                          <View style={styles.metaTextWrap}>
                            <Text style={styles.metaLabel}>Time</Text>
                            <Text style={styles.metaValue}>{event.time}</Text>
                          </View>
                        </View>

                        <View style={styles.metaRow}>
                          <View style={styles.metaIconWrap}>
                            <Ionicons
                              name="location-outline"
                              size={16}
                              color={GraceCourtColors.accent}
                            />
                          </View>
                          <View style={styles.metaTextWrap}>
                            <Text style={styles.metaLabel}>Location</Text>
                            <Text style={styles.metaValue}>{event.location}</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.cardActions}>
                        <InteractivePressable
                          disabled={isSubmitting || isDeleting}
                          onPress={() => {
                            startEditingEvent(event);
                          }}
                          style={styles.secondaryButton}>
                          <Text style={styles.secondaryButtonText}>Edit</Text>
                        </InteractivePressable>

                        <InteractivePressable
                          disabled={isDeleting}
                          onPress={() => {
                            handleDeleteEvent(event);
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

function formatEventDate(dateValue: string) {
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
  eventCard: {
    backgroundColor: GraceCourtColors.surface,
    borderRadius: GraceCourtRadius.card,
    padding: GraceCourtSpacing.cardPadding,
    ...GraceCourtShadows.card,
  },
  eventTitle: {
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
