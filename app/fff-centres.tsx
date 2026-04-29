import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Linking, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FadeInView } from '@/components/fade-in-view';
import { InteractivePressable } from '@/components/interactive-pressable';
import type { FffCentre } from '@/data/fffCentres';
import { supabase } from '@/lib/supabase';

export default function FffCentresScreen() {
  const [fffCentres, setFffCentres] = useState<FffCentre[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadCentres = async () => {
      try {
        const { data, error } = await supabase
          .from('fff_centres')
          .select('id, name, location, meeting_day, meeting_time, leader, phone');

        if (error) {
          throw error;
        }

        if (mounted) {
          setFffCentres(
            (data ?? []).map((centre) => ({
              id: String(centre.id),
              name: centre.name,
              location: centre.location,
              meetingDay: centre.meeting_day,
              meetingTime: centre.meeting_time,
              leader: centre.leader,
              phone: centre.phone,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to load FFF centres from Supabase.', error);

        if (mounted) {
          setFffCentres([]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadCentres();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <FadeInView>
          <View style={styles.header}>
            <Text style={styles.title}>FFF Centres</Text>
            <Text style={styles.subtitle}>Find a fellowship centre near you</Text>
          </View>

          <View style={styles.searchShell}>
            <Ionicons name="search" size={18} color="#7A879C" />
            <Text style={styles.searchText}>Search by area, estate, or centre name</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="location-outline" size={20} color="#0A2E73" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Grow in fellowship close to home</Text>
              <Text style={styles.infoText}>
                FFF centres are warm house fellowship gatherings where members pray, study the
                Word, and build strong spiritual community during the week.
              </Text>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.stateCard}>
              <Text style={styles.loadingText}>Loading centres...</Text>
            </View>
          ) : fffCentres.length === 0 ? (
            <View style={styles.stateCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="people-outline" size={22} color="#0A2E73" />
              </View>
              <Text style={styles.emptyTitle}>No centres available</Text>
              <Text style={styles.emptyText}>
                New fellowship centres will appear here as soon as they are added.
              </Text>
            </View>
          ) : (
            <View style={styles.cardList}>
              {fffCentres.map((centre) => (
                <InteractivePressable key={centre.id} onPress={() => {}} style={styles.card}>
                  <Text style={styles.cardTitle}>{centre.name}</Text>

                  <View style={styles.metaGroup}>
                    <Text style={styles.metaLabel}>Area</Text>
                    <Text style={styles.metaValue}>{centre.location}</Text>
                  </View>

                  <View style={styles.row}>
                    <View style={styles.rowItem}>
                      <Text style={styles.metaLabel}>Meeting Day</Text>
                      <Text style={styles.metaValue}>{centre.meetingDay}</Text>
                    </View>
                    <View style={styles.rowItem}>
                      <Text style={styles.metaLabel}>Meeting Time</Text>
                      <Text style={styles.metaValue}>{centre.meetingTime}</Text>
                    </View>
                  </View>

                  <View style={styles.metaGroup}>
                    <Text style={styles.metaLabel}>Leader</Text>
                    <Text style={styles.metaValue}>{centre.leader}</Text>
                  </View>

                  <View style={styles.metaGroup}>
                    <Text style={styles.metaLabel}>Phone</Text>
                    <InteractivePressable
                      accessibilityRole="button"
                      activeOpacity={0.85}
                      onPress={() => {
                        void Linking.openURL(`tel:${centre.phone}`);
                      }}
                      scaleTo={0.98}
                      style={styles.phoneLink}>
                      <Text style={styles.metaValue}>{`Phone: ${centre.phone}`}</Text>
                    </InteractivePressable>
                  </View>

                  <InteractivePressable
                    accessibilityRole="button"
                    activeOpacity={0.9}
                    onPress={() => {}}
                    scaleTo={0.98}
                    style={styles.joinButton}>
                    <Text style={styles.joinButtonText}>Join Centre</Text>
                  </InteractivePressable>
                </InteractivePressable>
              ))}
            </View>
          )}

          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>Need help finding a centre?</Text>
            <Text style={styles.helpText}>
              Reach out to church admin and we will gladly help you connect with the nearest FFF
              centre for fellowship and support.
            </Text>
          </View>
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
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0A2E73',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#5E739B',
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0A2E73',
    textAlign: 'center',
  },
  stateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#0A2E73',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
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
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F4',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  searchText: {
    fontSize: 14,
    color: '#7A879C',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#EEF3FC',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A2E73',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#31476E',
  },
  cardList: {
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#0A2E73',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111111',
    marginBottom: 14,
  },
  metaGroup: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  rowItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: '#5E739B',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 15,
    lineHeight: 22,
    color: '#22304D',
  },
  phoneLink: {
    alignSelf: 'flex-start',
  },
  joinButton: {
    marginTop: 6,
    backgroundColor: '#0A2E73',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  helpCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E2E8F4',
  },
  helpTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 6,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#5E739B',
  },
});
