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

type FffCentreRecord = {
  created_at: string;
  id: string;
  leader: string;
  location: string;
  meeting_day: string;
  meeting_time: string;
  name: string;
  phone: string;
};

type FeedbackTone = 'error' | 'success';

const emptyForm = {
  leader: '',
  location: '',
  meetingDay: '',
  meetingTime: '',
  name: '',
  phone: '',
};

export default function ManageFffCentresScreen() {
  const router = useRouter();
  const { authReady, isAdmin, session } = useAuth();
  const [centres, setCentres] = useState<FffCentreRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingCentreId, setDeletingCentreId] = useState<string | null>(null);
  const [editingCentreId, setEditingCentreId] = useState<string | null>(null);
  const [name, setName] = useState(emptyForm.name);
  const [location, setLocation] = useState(emptyForm.location);
  const [meetingDay, setMeetingDay] = useState(emptyForm.meetingDay);
  const [meetingTime, setMeetingTime] = useState(emptyForm.meetingTime);
  const [leader, setLeader] = useState(emptyForm.leader);
  const [phone, setPhone] = useState(emptyForm.phone);
  const [listErrorMessage, setListErrorMessage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>('success');

  const resetForm = () => {
    setName(emptyForm.name);
    setLocation(emptyForm.location);
    setMeetingDay(emptyForm.meetingDay);
    setMeetingTime(emptyForm.meetingTime);
    setLeader(emptyForm.leader);
    setPhone(emptyForm.phone);
    setEditingCentreId(null);
  };

  const setFeedback = (tone: FeedbackTone, nextMessage: string) => {
    setFeedbackTone(tone);
    setFeedbackMessage(nextMessage);
  };

  const loadCentres = async () => {
    try {
      const { data, error } = await supabase
        .from('fff_centres')
        .select('id, name, location, meeting_day, meeting_time, leader, phone, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setCentres(
        (data ?? []).map((item) => ({
          created_at: item.created_at,
          id: String(item.id),
          leader: item.leader,
          location: item.location,
          meeting_day: item.meeting_day,
          meeting_time: item.meeting_time,
          name: item.name,
          phone: item.phone,
        }))
      );
      setListErrorMessage('');
    } catch (error) {
      console.error('Failed to load FFF centres for admin.', error);
      setCentres([]);
      setListErrorMessage('We could not load FFF centres right now.');
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

    void loadCentres();
  }, [authReady, isAdmin]);

  const validateForm = () => {
    const trimmedName = name.trim();
    const trimmedLocation = location.trim();
    const trimmedMeetingDay = meetingDay.trim();
    const trimmedMeetingTime = meetingTime.trim();
    const trimmedLeader = leader.trim();
    const trimmedPhone = phone.trim();

    if (
      !trimmedName ||
      !trimmedLocation ||
      !trimmedMeetingDay ||
      !trimmedMeetingTime ||
      !trimmedLeader ||
      !trimmedPhone
    ) {
      setFeedback(
        'error',
        'Complete the name, location, meeting day, meeting time, leader, and phone before saving.'
      );
      return null;
    }

    return {
      leader: trimmedLeader,
      location: trimmedLocation,
      meeting_day: trimmedMeetingDay,
      meeting_time: trimmedMeetingTime,
      name: trimmedName,
      phone: trimmedPhone,
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
      if (editingCentreId) {
        const { error } = await supabase
          .from('fff_centres')
          .update(payload)
          .eq('id', editingCentreId);

        if (error) {
          throw error;
        }

        setFeedback('success', 'FFF centre updated successfully.');
      } else {
        const { error } = await supabase.from('fff_centres').insert(payload);

        if (error) {
          throw error;
        }

        setFeedback('success', 'FFF centre created successfully.');
      }

      resetForm();
      await loadCentres();
    } catch (error) {
      console.error('Failed to save FFF centre.', error);
      setFeedback('error', getFriendlyActionErrorMessage(error, 'We could not save this FFF centre right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditingCentre = (centre: FffCentreRecord) => {
    setEditingCentreId(centre.id);
    setName(centre.name);
    setLocation(centre.location);
    setMeetingDay(centre.meeting_day);
    setMeetingTime(centre.meeting_time);
    setLeader(centre.leader);
    setPhone(centre.phone);
    setFeedback('success', 'Editing FFF centre. Update the fields and save when ready.');
  };

  const handleDeleteCentre = (centre: FffCentreRecord) => {
    Alert.alert(
      'Delete FFF centre?',
      'This centre will be removed from the app for members and admins.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteCentre(centre.id);
          },
        },
      ]
    );
  };

  const deleteCentre = async (centreId: string) => {
    if (deletingCentreId) {
      return;
    }

    setDeletingCentreId(centreId);
    setFeedbackMessage('');

    try {
      const { error } = await supabase.from('fff_centres').delete().eq('id', centreId);

      if (error) {
        throw error;
      }

      if (editingCentreId === centreId) {
        resetForm();
      }

      setFeedback('success', 'FFF centre deleted successfully.');
      await loadCentres();
    } catch (error) {
      console.error('Failed to delete FFF centre.', error);
      setFeedback('error', getFriendlyActionErrorMessage(error, 'We could not delete this FFF centre right now.'));
    } finally {
      setDeletingCentreId(null);
    }
  };

  if (!authReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredState}>
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Loading admin tools...</Text>
            <Text style={styles.stateText}>
              We are checking your access before opening FFF centre management.
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
              Only users with the admin role can manage FFF centres.
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
            <Text style={styles.title}>Manage FFF Centres</Text>
            <Text style={styles.subtitle}>
              Create, update, and remove fellowship centres while keeping the member-facing centre
              experience unchanged.
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.sectionTitle}>
                {editingCentreId ? 'Edit FFF Centre' : 'Create FFF Centre'}
              </Text>
              {editingCentreId ? (
                <InteractivePressable onPress={resetForm} style={styles.secondaryChip}>
                  <Text style={styles.secondaryChipText}>Cancel Edit</Text>
                </InteractivePressable>
              ) : null}
            </View>

            <View style={styles.formFields}>
              <View style={styles.field}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  onChangeText={setName}
                  placeholder="GraceCourt Lekki Centre"
                  placeholderTextColor={GraceCourtColors.textMuted}
                  style={styles.input}
                  value={name}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  onChangeText={setLocation}
                  placeholder="Lekki Phase 1"
                  placeholderTextColor={GraceCourtColors.textMuted}
                  style={styles.input}
                  value={location}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Meeting Day</Text>
                <TextInput
                  onChangeText={setMeetingDay}
                  placeholder="Wednesday"
                  placeholderTextColor={GraceCourtColors.textMuted}
                  style={styles.input}
                  value={meetingDay}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Meeting Time</Text>
                <TextInput
                  onChangeText={setMeetingTime}
                  placeholder="6:00 PM"
                  placeholderTextColor={GraceCourtColors.textMuted}
                  style={styles.input}
                  value={meetingTime}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Leader</Text>
                <TextInput
                  onChangeText={setLeader}
                  placeholder="Brother John Doe"
                  placeholderTextColor={GraceCourtColors.textMuted}
                  style={styles.input}
                  value={leader}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  keyboardType="phone-pad"
                  onChangeText={setPhone}
                  placeholder="08012345678"
                  placeholderTextColor={GraceCourtColors.textMuted}
                  style={styles.input}
                  value={phone}
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
                  ? editingCentreId
                    ? 'Updating...'
                    : 'Creating...'
                  : editingCentreId
                    ? 'Update FFF Centre'
                    : 'Create FFF Centre'}
              </Text>
            </InteractivePressable>
          </View>

          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>Published FFF Centres</Text>

            {isLoading ? (
              <View style={styles.stateCardInline}>
                <Text style={styles.stateInlineText}>Loading FFF centres...</Text>
              </View>
            ) : listErrorMessage ? (
              <View style={styles.stateCardInline}>
                <Text style={styles.stateInlineTitle}>FFF centres unavailable</Text>
                <Text style={styles.stateInlineText}>{listErrorMessage}</Text>
              </View>
            ) : centres.length === 0 ? (
              <View style={styles.stateCardInline}>
                <Text style={styles.stateInlineTitle}>No FFF centres yet</Text>
                <Text style={styles.stateInlineText}>
                  Your first admin centre will appear here right after you create it.
                </Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {centres.map((centre) => {
                  const isDeleting = deletingCentreId === centre.id;

                  return (
                    <View key={centre.id} style={styles.centreCard}>
                      <Text style={styles.centreTitle}>{centre.name}</Text>

                      <View style={styles.metaStack}>
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
                            <Text style={styles.metaValue}>{centre.location}</Text>
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
                            <Text style={styles.metaLabel}>Meeting Day</Text>
                            <Text style={styles.metaValue}>{centre.meeting_day}</Text>
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
                            <Text style={styles.metaLabel}>Meeting Time</Text>
                            <Text style={styles.metaValue}>{centre.meeting_time}</Text>
                          </View>
                        </View>

                        <View style={styles.metaRow}>
                          <View style={styles.metaIconWrap}>
                            <Ionicons name="person-outline" size={16} color={GraceCourtColors.accent} />
                          </View>
                          <View style={styles.metaTextWrap}>
                            <Text style={styles.metaLabel}>Leader</Text>
                            <Text style={styles.metaValue}>{centre.leader}</Text>
                          </View>
                        </View>

                        <View style={styles.metaRow}>
                          <View style={styles.metaIconWrap}>
                            <Ionicons name="call-outline" size={16} color={GraceCourtColors.accent} />
                          </View>
                          <View style={styles.metaTextWrap}>
                            <Text style={styles.metaLabel}>Phone</Text>
                            <Text style={styles.metaValue}>{centre.phone}</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.cardActions}>
                        <InteractivePressable
                          disabled={isSubmitting || isDeleting}
                          onPress={() => {
                            startEditingCentre(centre);
                          }}
                          style={styles.secondaryButton}>
                          <Text style={styles.secondaryButtonText}>Edit</Text>
                        </InteractivePressable>

                        <InteractivePressable
                          disabled={isDeleting}
                          onPress={() => {
                            handleDeleteCentre(centre);
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
  centreCard: {
    backgroundColor: GraceCourtColors.surface,
    borderRadius: GraceCourtRadius.card,
    padding: GraceCourtSpacing.cardPadding,
    ...GraceCourtShadows.card,
  },
  centreTitle: {
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
