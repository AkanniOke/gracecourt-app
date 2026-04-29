import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import type { Sermon } from '@/data/sermons';
import { FIXED_PASTOR_NAME, formatSermonDate } from '@/lib/sermons';
import { supabase } from '@/lib/supabase';

export default function SermonsScreen() {
  const router = useRouter();
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadSermons = async () => {
      try {
        const { data, error } = await supabase
          .from('sermons')
          .select('id, title, speaker, date, media_url')
          .order('date', { ascending: false });

        if (error) {
          throw error;
        }

        if (mounted) {
          setSermons(
            (data ?? []).map((sermon) => ({
              id: String(sermon.id),
              title: sermon.title,
              speaker: FIXED_PASTOR_NAME,
              date: formatSermonDate(sermon.date),
              mediaUrl: sermon.media_url ?? null,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to load sermons from Supabase.', error);

        if (mounted) {
          setSermons([]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadSermons();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <FadeInView>
          <Text style={styles.title}>Sermons</Text>
          <Text style={styles.subtitle}>Open a message for a focused listening experience</Text>

          {isLoading ? (
            <View style={styles.stateCard}>
              <Text style={styles.loadingText}>Loading sermons...</Text>
            </View>
          ) : sermons.length === 0 ? (
            <View style={styles.stateCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="mic-outline" size={22} color={GraceCourtColors.accent} />
              </View>
              <Text style={styles.emptyTitle}>No sermons yet</Text>
              <Text style={styles.emptyText}>
                Fresh messages will appear here as soon as they are added.
              </Text>
            </View>
          ) : (
            <View style={styles.cardList}>
              {sermons.map((sermon) => (
                <InteractivePressable
                  key={sermon.id}
                  activeOpacity={0.95}
                  onPress={() =>
                    router.push({
                      pathname: '/sermons/[id]',
                      params: {
                        id: sermon.id,
                        title: sermon.title,
                        date: sermon.date,
                        mediaUrl: sermon.mediaUrl ?? '',
                      },
                    })
                  }
                  scaleTo={0.985}
                  style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.dateChip}>
                      <Ionicons name="calendar-outline" size={14} color={GraceCourtColors.accent} />
                      <Text style={styles.dateChipText}>{sermon.date}</Text>
                    </View>

                    <View style={styles.chevronWrap}>
                      <Ionicons name="chevron-forward" size={18} color={GraceCourtColors.accent} />
                    </View>
                  </View>

                  <Text style={styles.cardTitle}>{sermon.title}</Text>
                  <Text style={styles.cardSpeaker}>{sermon.speaker}</Text>

                  <View style={styles.cardFooter}>
                    <Text style={styles.cardHint}>Tap to open sermon details</Text>
                    <View style={styles.listenPill}>
                      <Ionicons name="play-circle-outline" size={16} color={GraceCourtColors.surface} />
                      <Text style={styles.listenPillText}>Listen</Text>
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
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GraceCourtColors.tintSurface,
    borderRadius: GraceCourtRadius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: GraceCourtColors.accentSoft,
  },
  chevronWrap: {
    width: 36,
    height: 36,
    borderRadius: GraceCourtRadius.icon,
    backgroundColor: GraceCourtColors.tintSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: GraceCourtColors.textPrimary,
  },
  cardSpeaker: {
    fontSize: 15,
    lineHeight: 22,
    color: GraceCourtColors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardHint: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: GraceCourtColors.accentSoft,
  },
  listenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: GraceCourtColors.accent,
    borderRadius: GraceCourtRadius.pill,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  listenPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: GraceCourtColors.surface,
  },
});
