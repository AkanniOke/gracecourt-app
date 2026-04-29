import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FadeInView } from '@/components/fade-in-view';
import { InteractivePressable } from '@/components/interactive-pressable';
import { supabase } from '@/lib/supabase';

type PrayerItem = {
  id: string;
  title: string;
  content: string;
  bibleVerse: string;
  date: string;
};

export default function DailyPrayerScreen() {
  const [todayPrayer, setTodayPrayer] = useState<PrayerItem | null>(null);
  const [previousPrayers, setPreviousPrayers] = useState<PrayerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  useEffect(() => {
    let mounted = true;

    const loadPrayerData = async () => {
      try {
        const { data, error } = await supabase
          .from('prayers')
          .select('id, title, content, bible_verse, date')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        const prayers = (data ?? []).map((prayer) => ({
          id: String(prayer.id),
          title: prayer.title,
          content: prayer.content,
          bibleVerse: prayer.bible_verse,
          date: new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }).format(new Date(`${prayer.date}T00:00:00`)),
        }));

        if (mounted) {
          setTodayPrayer(prayers[0] ?? null);
          setPreviousPrayers(prayers.slice(1));
        }
      } catch (error) {
        console.error('Failed to load prayers from Supabase.', error);

        if (mounted) {
          setTodayPrayer(null);
          setPreviousPrayers([]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadPrayerData();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <FadeInView>
          <View style={styles.topSection}>
            <Text style={styles.date}>{currentDate}</Text>
            <Text style={styles.title}>Daily Prayer</Text>
          </View>

          {isLoading ? (
            <View style={styles.stateCard}>
              <Text style={styles.loadingText}>Loading prayer...</Text>
            </View>
          ) : !todayPrayer ? (
            <View style={styles.stateCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="book-outline" size={22} color="#0A2E73" />
              </View>
              <Text style={styles.emptyTitle}>No prayers available</Text>
              <Text style={styles.emptyText}>
                A daily prayer will appear here as soon as it is added.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.prayerTitle}>{todayPrayer.title}</Text>
                <Text style={styles.prayerText}>{todayPrayer.content}</Text>

                {todayPrayer.bibleVerse ? (
                  <View style={styles.verseSection}>
                    <Text style={styles.sectionLabel}>Bible Verse</Text>
                    <Text style={styles.verseText}>{todayPrayer.bibleVerse}</Text>
                  </View>
                ) : null}

                <View style={styles.dateSection}>
                  <Text style={styles.dateLabel}>Prayer Date</Text>
                  <Text style={styles.dateValue}>{todayPrayer.date}</Text>
                </View>
              </View>

              <InteractivePressable
                accessibilityRole="button"
                activeOpacity={0.9}
                onPress={() => {}}
                scaleTo={0.98}
                style={styles.shareButton}>
                <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
                <Text style={styles.shareButtonText}>Share Prayer</Text>
              </InteractivePressable>

              <View style={styles.previousSection}>
                <Text style={styles.previousTitle}>Previous Prayers</Text>

                {previousPrayers.length === 0 ? (
                  <View style={styles.previousEmptyCard}>
                    <Text style={styles.previousEmptyText}>
                      Older prayers will appear here once more entries are available.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.previousList}>
                    {previousPrayers.map((item) => (
                      <InteractivePressable
                        key={item.id}
                        onPress={() => {}}
                        style={styles.previousItem}>
                        <Text style={styles.previousItemTitle}>{item.title}</Text>
                        <Text style={styles.previousItemDate}>{item.date}</Text>
                      </InteractivePressable>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 36,
  },
  topSection: {
    marginBottom: 20,
  },
  date: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5E739B',
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0A2E73',
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0A2E73',
    textAlign: 'center',
  },
  stateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 26,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#0A2E73',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 5,
  },
  emptyIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EEF3FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#5E739B',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 22,
    shadowColor: '#0A2E73',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 5,
    marginBottom: 18,
  },
  prayerTitle: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '800',
    color: '#0A2E73',
    marginBottom: 14,
  },
  prayerText: {
    fontSize: 16,
    lineHeight: 28,
    color: '#1B2433',
    marginBottom: 20,
  },
  verseSection: {
    backgroundColor: '#EEF3FC',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#0A2E73',
    marginBottom: 8,
  },
  verseText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#31476E',
    fontStyle: 'italic',
  },
  dateSection: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F4',
    paddingTop: 16,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7A879C',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 15,
    lineHeight: 24,
    color: '#31476E',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0A2E73',
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowColor: '#0A2E73',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 4,
    marginBottom: 28,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  previousSection: {
    gap: 14,
  },
  previousTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111111',
  },
  previousList: {
    gap: 12,
  },
  previousEmptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  previousEmptyText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#5E739B',
  },
  previousItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  previousItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#172133',
    marginBottom: 6,
  },
  previousItemDate: {
    fontSize: 13,
    color: '#5E739B',
  },
});
