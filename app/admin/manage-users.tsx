import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

import { FadeInView } from '@/components/fade-in-view';
import { InteractivePressable } from '@/components/interactive-pressable';
import { KeyboardSafeScrollView } from '@/components/keyboard-safe-scroll-view';
import {
  GraceCourtColors,
  GraceCourtRadius,
  GraceCourtShadows,
  GraceCourtSpacing,
} from '@/constants/gracecourt-ui';
import type { UserRole } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { getFriendlyActionErrorMessage } from '@/lib/user-facing-error';

type UserRecord = {
  created_at: string;
  email: string | null;
  full_name: string;
  id: string;
  phone: string;
  position: string;
  role: UserRole;
};

type FeedbackTone = 'error' | 'success';

const roleOptions: { description: string; label: string; value: UserRole }[] = [
  {
    description: 'Standard member access',
    label: 'Member',
    value: 'member',
  },
  {
    description: 'Full admin tools access',
    label: 'Admin',
    value: 'admin',
  },
];

const positionOptions = [
  'Member',
  'Worker',
  'HOD',
  'MIC',
  'Workers Directorate',
  'Assistant Resident Pastor',
  'Resident Pastor',
  'Associate Pastor',
  'Co-Lead Pastor',
  'Lead Pastor',
];

export default function ManageUsersScreen() {
  const router = useRouter();
  const { authReady, currentUser, isAdmin, refreshCurrentUserProfile, session } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('member');
  const [selectedPosition, setSelectedPosition] = useState('Member');
  const [listErrorMessage, setListErrorMessage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>('success');

  const editingUser = useMemo(
    () => users.find((user) => user.id === editingUserId) ?? null,
    [editingUserId, users]
  );

  const positionChoices = useMemo(() => {
    const trimmedPosition = selectedPosition.trim();

    if (!trimmedPosition || positionOptions.includes(trimmedPosition)) {
      return positionOptions;
    }

    return [trimmedPosition, ...positionOptions];
  }, [selectedPosition]);

  const setFeedback = (tone: FeedbackTone, nextMessage: string) => {
    setFeedbackTone(tone);
    setFeedbackMessage(nextMessage);
  };

  const resetEdit = () => {
    setEditingUserId(null);
    setSelectedRole('member');
    setSelectedPosition('Member');
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, phone, role, position, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setUsers(
        (data ?? []).map((item) => ({
          created_at: item.created_at,
          email: item.email ?? null,
          full_name: item.full_name ?? 'GraceCourt Member',
          id: String(item.id),
          phone: item.phone ?? '',
          position: item.position ?? 'Member',
          role: item.role === 'admin' ? 'admin' : 'member',
        }))
      );
      setListErrorMessage('');
    } catch (error) {
      console.error('Failed to load users for admin.', error);
      setUsers([]);
      setListErrorMessage('We could not load registered users right now.');
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

    void loadUsers();
  }, [authReady, isAdmin]);

  const startEditingUser = (user: UserRecord) => {
    setEditingUserId(user.id);
    setSelectedRole(user.role);
    setSelectedPosition(user.position || 'Member');
    setFeedback('success', `Editing ${user.full_name}. Role and position are saved separately.`);
  };

  const updateUser = async (user: UserRecord) => {
    if (isUpdating) {
      return;
    }

    const nextPosition = selectedPosition.trim() || 'Member';

    setIsUpdating(true);
    setFeedbackMessage('');

    try {
      const { error } = await supabase
        .from('users')
        .update({
          position: nextPosition,
          role: selectedRole,
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      resetEdit();
      await loadUsers();

      if (currentUser?.id === user.id) {
        const refreshedProfile = await refreshCurrentUserProfile();

        if (refreshedProfile?.role !== 'admin') {
          router.replace('/(tabs)/profile');
          return;
        }
      }

      setFeedback('success', 'User updated successfully.');
    } catch (error) {
      console.error('Failed to update user.', error);
      setFeedback('error', getFriendlyActionErrorMessage(error, 'We could not update this user right now.'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveUser = () => {
    if (!editingUser) {
      setFeedback('error', 'Select a user before saving changes.');
      return;
    }

    if (currentUser?.id === editingUser.id && editingUser.role === 'admin' && selectedRole === 'member') {
      Alert.alert(
        'Remove your admin role?',
        'Role controls app access. If you continue, you may lose access to admin tools immediately.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save anyway',
            style: 'destructive',
            onPress: () => {
              void updateUser(editingUser);
            },
          },
        ]
      );
      return;
    }

    void updateUser(editingUser);
  };

  if (!authReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredState}>
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Loading admin tools...</Text>
            <Text style={styles.stateText}>
              We are checking your access before opening user management.
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
              Only users with the admin role can manage registered users.
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
            <View style={styles.heroBadge}>
              <Ionicons name="person-circle-outline" size={18} color={GraceCourtColors.accent} />
              <Text style={styles.heroBadgeText}>Admin Only</Text>
            </View>
            <Text style={styles.title}>Manage Users</Text>
            <Text style={styles.subtitle}>Manage user roles and church positions</Text>
            <Text style={styles.heroCopy}>
              Role controls app access. Position is kept separate as a church identity or title.
            </Text>
          </View>

          {editingUser ? (
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <View style={styles.formHeaderText}>
                  <Text style={styles.sectionTitle}>Edit User</Text>
                  <Text style={styles.formSubtitle}>{editingUser.full_name}</Text>
                </View>
                <InteractivePressable
                  disabled={isUpdating}
                  onPress={resetEdit}
                  style={styles.secondaryChip}>
                  <Text style={styles.secondaryChipText}>Cancel Edit</Text>
                </InteractivePressable>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Role</Text>
                <Text style={styles.helperText}>Role controls app permissions and admin access.</Text>
                <View style={styles.optionStack}>
                  {roleOptions.map((option) => {
                    const isSelected = selectedRole === option.value;

                    return (
                      <InteractivePressable
                        key={option.value}
                        disabled={isUpdating}
                        onPress={() => {
                          setSelectedRole(option.value);
                        }}
                        style={[styles.roleOption, isSelected && styles.roleOptionSelected]}>
                        <View style={styles.roleOptionIcon}>
                          <Ionicons
                            name={option.value === 'admin' ? 'shield-checkmark-outline' : 'person-outline'}
                            size={18}
                            color={isSelected ? GraceCourtColors.surface : GraceCourtColors.accent}
                          />
                        </View>
                        <View style={styles.roleOptionTextWrap}>
                          <Text
                            style={[
                              styles.roleOptionLabel,
                              isSelected && styles.roleOptionLabelSelected,
                            ]}>
                            {option.label}
                          </Text>
                          <Text
                            style={[
                              styles.roleOptionDescription,
                              isSelected && styles.roleOptionDescriptionSelected,
                            ]}>
                            {option.description}
                          </Text>
                        </View>
                      </InteractivePressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Position</Text>
                <Text style={styles.helperText}>Position is the church title shown for identity.</Text>
                <TextInput
                  onChangeText={setSelectedPosition}
                  placeholder="Member"
                  placeholderTextColor={GraceCourtColors.textMuted}
                  style={styles.input}
                  value={selectedPosition}
                />
                <View style={styles.positionWrap}>
                  {positionChoices.map((position) => {
                    const isSelected = selectedPosition === position;

                    return (
                      <InteractivePressable
                        key={position}
                        disabled={isUpdating}
                        onPress={() => {
                          setSelectedPosition(position);
                        }}
                        style={[
                          styles.positionChip,
                          isSelected && styles.positionChipSelected,
                        ]}>
                        <Text
                          style={[
                            styles.positionChipText,
                            isSelected && styles.positionChipTextSelected,
                          ]}>
                          {position}
                        </Text>
                      </InteractivePressable>
                    );
                  })}
                </View>
              </View>

              <InteractivePressable
                disabled={isUpdating}
                onPress={handleSaveUser}
                style={[styles.primaryButton, isUpdating && styles.buttonDisabled]}>
                <Text style={styles.primaryButtonText}>
                  {isUpdating ? 'Updating User...' : 'Save User Changes'}
                </Text>
              </InteractivePressable>
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

          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>Registered Users</Text>

            {isLoading ? (
              <View style={styles.stateCardInline}>
                <Text style={styles.stateInlineText}>Loading users...</Text>
              </View>
            ) : listErrorMessage ? (
              <View style={styles.stateCardInline}>
                <Text style={styles.stateInlineTitle}>Users unavailable</Text>
                <Text style={styles.stateInlineText}>{listErrorMessage}</Text>
              </View>
            ) : users.length === 0 ? (
              <View style={styles.stateCardInline}>
                <Text style={styles.stateInlineTitle}>No users yet</Text>
                <Text style={styles.stateInlineText}>
                  Registered GraceCourt users will appear here when profiles are created.
                </Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {users.map((user) => {
                  const isEditing = editingUserId === user.id;

                  return (
                    <View key={user.id} style={[styles.userCard, isEditing && styles.userCardActive]}>
                      <View style={styles.userHeader}>
                        <View style={styles.avatarWrap}>
                          <Text style={styles.avatarText}>{getInitials(user.full_name)}</Text>
                        </View>
                        <View style={styles.userTitleWrap}>
                          <Text style={styles.userName}>{user.full_name}</Text>
                          <Text style={styles.userEmail}>{user.email ?? 'No email on profile'}</Text>
                        </View>
                      </View>

                      <View style={styles.metaStack}>
                        {user.phone ? (
                          <View style={styles.metaRow}>
                            <View style={styles.metaIconWrap}>
                              <Ionicons
                                name="call-outline"
                                size={15}
                                color={GraceCourtColors.accent}
                              />
                            </View>
                            <Text style={styles.metaValue}>{user.phone}</Text>
                          </View>
                        ) : null}

                        <View style={styles.pillRow}>
                          <View style={styles.rolePill}>
                            <Ionicons
                              name={user.role === 'admin' ? 'shield-checkmark-outline' : 'person-outline'}
                              size={14}
                              color={GraceCourtColors.accent}
                            />
                            <Text style={styles.rolePillText}>{formatLabel(user.role)}</Text>
                          </View>
                          <View style={styles.positionPill}>
                            <Ionicons
                              name="ribbon-outline"
                              size={14}
                              color={GraceCourtColors.accentSoft}
                            />
                            <Text style={styles.positionPillText}>{user.position}</Text>
                          </View>
                        </View>
                      </View>

                      <InteractivePressable
                        disabled={isUpdating}
                        onPress={() => {
                          startEditingUser(user);
                        }}
                        style={styles.secondaryButton}>
                        <Text style={styles.secondaryButtonText}>
                          {isEditing ? 'Editing' : 'Edit'}
                        </Text>
                      </InteractivePressable>
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

function formatLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GraceCourtColors.accent,
    marginBottom: 12,
  },
  heroCopy: {
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  formHeaderText: {
    flex: 1,
  },
  formSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: GraceCourtColors.accentSoft,
    marginTop: 4,
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
  field: {
    gap: 10,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: GraceCourtColors.textPrimary,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 20,
    color: GraceCourtColors.accentSoft,
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
  optionStack: {
    gap: 10,
  },
  roleOption: {
    borderWidth: 1,
    borderColor: GraceCourtColors.border,
    borderRadius: GraceCourtRadius.medium,
    padding: 14,
    backgroundColor: GraceCourtColors.tintSurfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleOptionSelected: {
    borderColor: GraceCourtColors.accent,
    backgroundColor: GraceCourtColors.accent,
  },
  roleOptionIcon: {
    width: 38,
    height: 38,
    borderRadius: GraceCourtRadius.icon,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleOptionTextWrap: {
    flex: 1,
  },
  roleOptionLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: GraceCourtColors.textPrimary,
    marginBottom: 3,
  },
  roleOptionLabelSelected: {
    color: GraceCourtColors.surface,
  },
  roleOptionDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: GraceCourtColors.accentSoft,
  },
  roleOptionDescriptionSelected: {
    color: GraceCourtColors.textSoft,
  },
  positionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  positionChip: {
    borderWidth: 1,
    borderColor: GraceCourtColors.border,
    borderRadius: GraceCourtRadius.pill,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: GraceCourtColors.tintSurfaceAlt,
  },
  positionChipSelected: {
    borderColor: GraceCourtColors.accent,
    backgroundColor: GraceCourtColors.accent,
  },
  positionChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: GraceCourtColors.accent,
  },
  positionChipTextSelected: {
    color: GraceCourtColors.surface,
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
  userCard: {
    backgroundColor: GraceCourtColors.surface,
    borderRadius: GraceCourtRadius.card,
    padding: GraceCourtSpacing.cardPadding,
    ...GraceCourtShadows.card,
  },
  userCardActive: {
    borderWidth: 2,
    borderColor: GraceCourtColors.textSoft,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: GraceCourtColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: GraceCourtColors.surface,
  },
  userTitleWrap: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: GraceCourtColors.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    lineHeight: 20,
    color: GraceCourtColors.accentSoft,
  },
  metaStack: {
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaIconWrap: {
    width: 34,
    height: 34,
    borderRadius: GraceCourtRadius.icon,
    backgroundColor: GraceCourtColors.tintSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaValue: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: GraceCourtColors.textSecondary,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GraceCourtColors.tintSurface,
    borderRadius: GraceCourtRadius.pill,
    paddingVertical: 8,
    paddingHorizontal: 11,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: GraceCourtColors.accent,
  },
  positionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GraceCourtColors.tintSurfaceAlt,
    borderRadius: GraceCourtRadius.pill,
    borderWidth: 1,
    borderColor: GraceCourtColors.border,
    paddingVertical: 8,
    paddingHorizontal: 11,
  },
  positionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: GraceCourtColors.accentSoft,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: GraceCourtColors.border,
    borderRadius: GraceCourtRadius.medium,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    backgroundColor: GraceCourtColors.tintSurfaceAlt,
    marginTop: 18,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: GraceCourtColors.accent,
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
