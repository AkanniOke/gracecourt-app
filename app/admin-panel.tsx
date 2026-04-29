import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FadeInView } from '@/components/fade-in-view';
import { InteractivePressable } from '@/components/interactive-pressable';
import {
  GraceCourtColors,
  GraceCourtRadius,
  GraceCourtShadows,
  GraceCourtSpacing,
} from '@/constants/gracecourt-ui';
import { useAuth } from '@/lib/auth-context';

type AdminAction = {
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  route?:
    | '/admin/manage-announcements'
    | '/admin/manage-events'
    | '/admin/manage-sermons'
    | '/admin/manage-daily-prayers'
    | '/admin/manage-fff-centres'
    | '/admin/manage-users'
    | '/admin/view-prayer-requests'
    | '/admin/view-service-feedback';
  title: string;
};

const adminActions: AdminAction[] = [
  {
    title: 'Manage Announcements',
    description: 'Create and organize important church updates.',
    icon: 'megaphone-outline',
    route: '/admin/manage-announcements',
  },
  {
    title: 'Manage Events',
    description: 'Review upcoming gatherings and ministry schedules.',
    icon: 'calendar-outline',
    route: '/admin/manage-events',
  },
  {
    title: 'Manage Sermons',
    description: 'Prepare sermon content, audio, and publishing flow.',
    icon: 'mic-outline',
    route: '/admin/manage-sermons',
  },
  {
    title: 'Manage Daily Prayers',
    description: 'Keep daily prayer content fresh and encouraging.',
    icon: 'book-outline',
    route: '/admin/manage-daily-prayers',
  },
  {
    title: 'Manage FFF Centres',
    description: 'Update fellowship centres, leaders, and meeting details.',
    icon: 'people-outline',
    route: '/admin/manage-fff-centres',
  },
  {
    title: 'Manage Users',
    description: 'Update user roles and church positions.',
    icon: 'person-circle-outline',
    route: '/admin/manage-users',
  },
  {
    title: 'View Prayer Requests',
    description: 'Care for submitted requests with the pastoral team.',
    icon: 'heart-outline',
    route: '/admin/view-prayer-requests',
  },
  {
    title: 'View Service Feedback',
    description: 'Review submitted service ratings and remarks.',
    icon: 'star-outline',
    route: '/admin/view-service-feedback',
  },
];

export default function AdminPanelScreen() {
  const router = useRouter();
  const { authReady, isAdmin, session } = useAuth();

  if (!authReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredState}>
          <View style={styles.stateCard}>
            <Text style={styles.loadingTitle}>Loading admin access...</Text>
            <Text style={styles.stateText}>
              We are confirming your permissions before opening the panel.
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
            <Text style={styles.deniedTitle}>Access denied</Text>
            <Text style={styles.stateText}>
              This area is reserved for users whose role is explicitly set to admin.
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
          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <Ionicons name="shield-checkmark-outline" size={18} color={GraceCourtColors.accent} />
              <Text style={styles.heroBadgeText}>Admin Access</Text>
            </View>
            <Text style={styles.title}>Admin Panel</Text>
            <Text style={styles.subtitle}>Manage church content</Text>
            <Text style={styles.heroCopy}>
              The tools below are ready for the next step when you want to add full admin
              workflows.
            </Text>
          </View>

          <View style={styles.actionsSection}>
            {adminActions.map((action) => (
              <InteractivePressable
                key={action.title}
                disabled={!action.route}
                onPress={() => {
                  if (action.route) {
                    router.push(action.route);
                  }
                }}
                style={[styles.actionCard, !action.route && styles.actionCardDisabled]}>
                <View style={styles.actionIconWrap}>
                  <Ionicons name={action.icon} size={22} color={GraceCourtColors.accent} />
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionDescription}>{action.description}</Text>
                </View>
                <Ionicons
                  name={action.route ? 'chevron-forward' : 'time-outline'}
                  size={18}
                  color={GraceCourtColors.textMuted}
                  style={styles.actionChevron}
                />
              </InteractivePressable>
            ))}
          </View>
        </FadeInView>
      </ScrollView>
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
  stateCard: {
    backgroundColor: GraceCourtColors.surface,
    borderRadius: GraceCourtRadius.large,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    ...GraceCourtShadows.card,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: GraceCourtColors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
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
  deniedTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: GraceCourtColors.textPrimary,
    marginBottom: 8,
  },
  stateText: {
    fontSize: 15,
    lineHeight: 23,
    color: GraceCourtColors.accentSoft,
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
    fontSize: 32,
    fontWeight: '800',
    color: GraceCourtColors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GraceCourtColors.accent,
    marginBottom: 12,
  },
  heroCopy: {
    fontSize: 15,
    lineHeight: 24,
    color: GraceCourtColors.accentSoft,
  },
  actionsSection: {
    gap: GraceCourtSpacing.tight,
  },
  actionCard: {
    backgroundColor: GraceCourtColors.surface,
    borderRadius: GraceCourtRadius.medium,
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    ...GraceCourtShadows.subtle,
  },
  actionCardDisabled: {
    opacity: 0.84,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: GraceCourtRadius.icon,
    backgroundColor: GraceCourtColors.tintSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionTextWrap: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GraceCourtColors.textPrimary,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: GraceCourtColors.accentSoft,
  },
  actionChevron: {
    marginLeft: 12,
  },
});
