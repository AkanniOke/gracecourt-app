import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FadeInView } from '@/components/fade-in-view';
import { InteractivePressable } from '@/components/interactive-pressable';
import {
  GraceCourtColors,
  GraceCourtRadius,
  GraceCourtShadows,
  GraceCourtSpacing,
} from '@/constants/gracecourt-ui';
import { supabase } from '../../lib/supabase';

type Announcement = {
  id: string;
  title: string;
  message: string;
  date: string;
  created_at: string;
};

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadAnnouncements = async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('id, title, message, date, created_at')
        .order('date', { ascending: false });

      if (mounted) {
        if (error) {
          setErrorMessage('Unable to load announcements right now.');
          setAnnouncements([]);
        } else {
          setErrorMessage('');
          setAnnouncements(data ?? []);
        }
        setIsLoading(false);
      }
    };

    loadAnnouncements();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <FadeInView>
          <Text style={styles.title}>Announcements</Text>
          <Text style={styles.subtitle}>Stay connected with what is happening in church life.</Text>

          {isLoading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : errorMessage ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Announcements unavailable</Text>
              <Text style={styles.emptyText}>{errorMessage}</Text>
            </View>
          ) : announcements.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No announcements yet</Text>
              <Text style={styles.emptyText}>
                New church updates will appear here as soon as they are published.
              </Text>
            </View>
          ) : (
            <View style={styles.cardList}>
              {announcements.map((announcement) => (
                <InteractivePressable key={announcement.id} onPress={() => {}} style={styles.card}>
                  <View style={styles.dateRow}>
                    <View style={styles.dateChip}>
                      <Ionicons name="calendar-outline" size={14} color={GraceCourtColors.accent} />
                      <Text style={styles.cardDate}>{announcement.date}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardTitle}>{announcement.title}</Text>
                  <Text style={styles.cardMessage}>{announcement.message}</Text>
                </InteractivePressable>
              ))}
            </View>
          )}
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
  title: {
    fontSize: 31,
    fontWeight: '800',
    color: GraceCourtColors.surface,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: GraceCourtColors.textSoft,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
    color: GraceCourtColors.surface,
    textAlign: 'center',
    marginTop: 12,
  },
  emptyCard: {
    backgroundColor: GraceCourtColors.surface,
    borderRadius: GraceCourtRadius.card,
    padding: GraceCourtSpacing.cardPadding,
    alignItems: 'center',
    ...GraceCourtShadows.card,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GraceCourtColors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 22,
    color: GraceCourtColors.textMuted,
    textAlign: 'center',
  },
  cardList: {
    gap: GraceCourtSpacing.stack,
  },
  card: {
    backgroundColor: GraceCourtColors.surface,
    borderRadius: GraceCourtRadius.card,
    padding: GraceCourtSpacing.cardPadding,
    ...GraceCourtShadows.card,
  },
  dateRow: {
    marginBottom: 14,
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
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: GraceCourtColors.textPrimary,
    marginBottom: 10,
  },
  cardMessage: {
    fontSize: 15,
    lineHeight: 23,
    color: GraceCourtColors.textSecondary,
  },
  cardDate: {
    fontSize: 12,
    fontWeight: '600',
    color: GraceCourtColors.accentSoft,
  },
});
