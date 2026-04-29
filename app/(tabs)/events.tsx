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
import type { ChurchEvent } from '@/data/events';
import { supabase } from '@/lib/supabase';

const formatEventDate = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsedDate = new Date(`${value}T00:00:00`);

    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
  }

  return value;
};

export default function EventsScreen() {
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('id, title, date, time, location')
          .order('date', { ascending: true });

        if (error) {
          throw error;
        }

        if (mounted) {
          setEvents(
            (data ?? []).map((event) => ({
              id: String(event.id),
              title: event.title,
              date: formatEventDate(event.date),
              time: event.time,
              location: event.location,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to load events from Supabase.', error);

        if (mounted) {
          setEvents([]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadEvents();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <FadeInView>
          <Text style={styles.title}>Events</Text>
          <Text style={styles.subtitle}>Upcoming church activities</Text>

          {isLoading ? (
            <View style={styles.stateCard}>
              <Text style={styles.loadingText}>Loading events...</Text>
            </View>
          ) : events.length === 0 ? (
            <View style={styles.stateCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="calendar-clear-outline" size={22} color={GraceCourtColors.accent} />
              </View>
              <Text style={styles.emptyTitle}>No events yet</Text>
              <Text style={styles.emptyText}>
                Check back soon for upcoming church activities and special gatherings.
              </Text>
            </View>
          ) : (
            <View style={styles.cardList}>
              {events.map((event) => (
                <InteractivePressable key={event.id} onPress={() => {}} style={styles.card}>
                  <Text style={styles.cardTitle}>{event.title}</Text>

                  <View style={styles.metaStack}>
                    <View style={styles.metaRow}>
                      <View style={styles.metaIconWrap}>
                        <Ionicons name="calendar-outline" size={16} color={GraceCourtColors.accent} />
                      </View>
                      <View style={styles.metaTextWrap}>
                        <Text style={styles.metaLabel}>Date</Text>
                        <Text style={styles.metaValue}>{event.date}</Text>
                      </View>
                    </View>

                    <View style={styles.metaRow}>
                      <View style={styles.metaIconWrap}>
                        <Ionicons name="time-outline" size={16} color={GraceCourtColors.accent} />
                      </View>
                      <View style={styles.metaTextWrap}>
                        <Text style={styles.metaLabel}>Time</Text>
                        <Text style={styles.metaValue}>{event.time}</Text>
                      </View>
                    </View>

                    <View style={styles.metaRow}>
                      <View style={styles.metaIconWrap}>
                        <Ionicons name="location-outline" size={16} color={GraceCourtColors.accent} />
                      </View>
                      <View style={styles.metaTextWrap}>
                        <Text style={styles.metaLabel}>Location</Text>
                        <Text style={styles.metaValue}>{event.location}</Text>
                      </View>
                    </View>
                  </View>
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
  stateCard: {
    backgroundColor: GraceCourtColors.surface,
    borderRadius: GraceCourtRadius.card,
    padding: GraceCourtSpacing.cardPadding,
    alignItems: 'center',
    ...GraceCourtShadows.card,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
    color: GraceCourtColors.textPrimary,
    textAlign: 'center',
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: GraceCourtRadius.icon,
    backgroundColor: GraceCourtColors.tintSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: GraceCourtColors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    color: GraceCourtColors.textSecondary,
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
  cardTitle: {
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
});
