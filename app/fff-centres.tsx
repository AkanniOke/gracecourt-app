import { Ionicons } from '@expo/vector-icons';
import { useDeferredValue, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FadeInView } from '@/components/fade-in-view';
import { InteractivePressable } from '@/components/interactive-pressable';
import { fffGeneralContact, type FffCentre } from '@/data/fffCentres';
import { supabase } from '@/lib/supabase';

const CONTACT_UNAVAILABLE_TITLE = 'Contact unavailable';

function getPhoneText(phone: unknown) {
  if (phone == null) {
    return null;
  }

  const normalizedPhone = String(phone).trim();
  return normalizedPhone.length > 0 ? normalizedPhone : null;
}

function getNormalizedPhoneDigits(phone: unknown) {
  const normalizedPhone = getPhoneText(phone);
  return normalizedPhone ? normalizedPhone.replace(/\D/g, '') : '';
}

function hasConfiguredPhoneNumber(phone: unknown) {
  const normalizedPhone = getPhoneText(phone);

  if (!normalizedPhone || /x/i.test(normalizedPhone)) {
    return false;
  }

  return getNormalizedPhoneDigits(phone).length >= 7;
}

function getDialerPhoneNumber(phone: unknown) {
  if (!hasConfiguredPhoneNumber(phone)) {
    return null;
  }

  const normalizedPhone = getPhoneText(phone);

  if (!normalizedPhone) {
    return null;
  }

  return normalizedPhone.replace(/(?!^\+)[\s\-()]/g, '');
}

function buildPhoneCallUrl(phone: unknown) {
  const dialerPhoneNumber = getDialerPhoneNumber(phone);
  return dialerPhoneNumber ? `tel:${dialerPhoneNumber}` : null;
}

function buildWhatsAppUrl(
  phone: unknown,
  whatsappLink: string | null | undefined
) {
  const trimmedWhatsAppLink = whatsappLink?.trim();

  if (trimmedWhatsAppLink) {
    return trimmedWhatsAppLink;
  }

  if (!hasConfiguredPhoneNumber(phone)) {
    return null;
  }

  return `https://wa.me/${getNormalizedPhoneDigits(phone)}`;
}

async function openUrlIfPossible(url: string | null) {
  if (!url) {
    return false;
  }

  try {
    const canOpen = await Linking.canOpenURL(url);

    if (!canOpen) {
      return false;
    }

    await Linking.openURL(url);
    return true;
  } catch (error) {
    console.error('Failed to open external contact link.', error);
    return false;
  }
}

export default function FffCentresScreen() {
  const [fffCentres, setFffCentres] = useState<FffCentre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    let mounted = true;

    const loadCentres = async () => {
      try {
        const { data, error } = await supabase
          .from('fff_centres')
          .select('id, name, location, meeting_day, meeting_time, leader, phone, whatsapp_link');

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
              phone: centre.phone == null ? null : String(centre.phone),
              whatsappLink: centre.whatsapp_link ?? null,
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

  const handleCallPress = async (contactName: string, phone: unknown) => {
    const rawPhoneValue = phone == null ? null : String(phone);
    const cleanedPhoneValue = getDialerPhoneNumber(phone);
    const phoneCallUrl = buildPhoneCallUrl(phone);

    console.log('FFF centre call tapped.', {
      centreName: contactName,
      cleanedPhoneValue,
      finalTelUrl: phoneCallUrl,
      rawPhoneValue,
    });

    if (!phoneCallUrl) {
      Alert.alert(CONTACT_UNAVAILABLE_TITLE, 'Phone number is not available for this centre.');
      return;
    }

    try {
      await Linking.openURL(phoneCallUrl);
    } catch (error) {
      console.error('Failed to open phone dialer.', error);
      Alert.alert(CONTACT_UNAVAILABLE_TITLE, 'Unable to open phone dialer.');
    }
  };

  const handleWhatsAppPress = async (
    phone: string | null | undefined,
    whatsappLink: string | null | undefined,
    unavailableMessage: string
  ) => {
    const opened = await openUrlIfPossible(buildWhatsAppUrl(phone, whatsappLink));

    if (!opened) {
      Alert.alert(CONTACT_UNAVAILABLE_TITLE, unavailableMessage);
    }
  };

  const handleJoinCentre = async (centre: FffCentre) => {
    if (await openUrlIfPossible(centre.whatsappLink?.trim() || null)) {
      return;
    }

    if (await openUrlIfPossible(buildWhatsAppUrl(centre.phone, null))) {
      return;
    }

    if (await openUrlIfPossible(buildPhoneCallUrl(centre.phone))) {
      return;
    }

    Alert.alert(
      CONTACT_UNAVAILABLE_TITLE,
      `We could not open a WhatsApp chat or call for ${centre.name} right now. Please try again later.`
    );
  };

  const generalWhatsAppMessage =
    'The general FFF WhatsApp contact is still being updated. Replace the placeholder number when it is ready.';
  const normalizedSearchQuery = deferredSearchQuery.trim().toLowerCase();
  const filteredCentres = normalizedSearchQuery
    ? fffCentres.filter((centre) =>
        [centre.name, centre.location, centre.leader, centre.meetingDay].some((value) =>
          value.toLowerCase().includes(normalizedSearchQuery)
        )
      )
    : fffCentres;

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
            <TextInput
              autoCapitalize="words"
              autoCorrect={false}
              onChangeText={setSearchQuery}
              placeholder="Search by area, leader, meeting day, or centre name"
              placeholderTextColor="#7A879C"
              style={styles.searchInput}
              value={searchQuery}
            />
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
          ) : filteredCentres.length === 0 ? (
            <View style={styles.stateCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="search-outline" size={22} color="#0A2E73" />
              </View>
              <Text style={styles.emptyTitle}>No FFF centre found</Text>
              <Text style={styles.emptyText}>
                Try another area or contact the church office.
              </Text>
            </View>
          ) : (
            <View style={styles.cardList}>
              {filteredCentres.map((centre) => (
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
                        void handleCallPress(centre.name, centre.phone);
                      }}
                      scaleTo={0.98}
                      style={styles.phoneLink}>
                      <Text style={styles.metaValue}>
                        {centre.phone ? `Phone: ${centre.phone}` : 'Phone not added yet'}
                      </Text>
                    </InteractivePressable>
                  </View>

                  <View style={styles.cardActionRow}>
                    <InteractivePressable
                      accessibilityRole="button"
                      activeOpacity={0.9}
                      onPress={() => {
                        void handleCallPress(centre.name, centre.phone);
                      }}
                      scaleTo={0.98}
                      style={styles.secondaryActionButton}>
                      <Ionicons name="call-outline" size={16} color="#0A2E73" />
                      <Text style={styles.secondaryActionText}>Call</Text>
                    </InteractivePressable>

                    <InteractivePressable
                      accessibilityRole="button"
                      activeOpacity={0.9}
                      onPress={() => {
                        void handleJoinCentre(centre);
                      }}
                      scaleTo={0.98}
                      style={styles.joinButton}>
                      <Text style={styles.joinButtonText}>Join Centre</Text>
                    </InteractivePressable>
                  </View>
                </InteractivePressable>
              ))}
            </View>
          )}

          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>Can&apos;t find a nearby FFF centre?</Text>
            <Text style={styles.helpText}>
              Contact us and we&apos;ll guide you to the closest fellowship centre.
            </Text>
            <Text style={styles.helpContactLabel}>General contact</Text>
            <Text style={styles.helpContactValue}>{fffGeneralContact.phone}</Text>

            <View style={styles.helpActionsRow}>
              <InteractivePressable
                accessibilityRole="button"
                activeOpacity={0.9}
                onPress={() => {
                  void handleCallPress('General admin contact', fffGeneralContact.phone);
                }}
                scaleTo={0.98}
                style={styles.helpCallButton}>
                <Ionicons name="call-outline" size={18} color="#0A2E73" />
                <Text style={styles.helpCallButtonText}>Call</Text>
              </InteractivePressable>

              <InteractivePressable
                accessibilityRole="button"
                activeOpacity={0.9}
                onPress={() => {
                  void handleWhatsAppPress(
                    fffGeneralContact.phone,
                    fffGeneralContact.whatsappLink,
                    generalWhatsAppMessage
                  );
                }}
                scaleTo={0.98}
                style={styles.helpWhatsAppButton}>
                <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                <Text style={styles.helpWhatsAppButtonText}>WhatsApp</Text>
              </InteractivePressable>
            </View>
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
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#22304D',
    paddingVertical: 0,
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
  cardActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  secondaryActionButton: {
    minWidth: 108,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF3FC',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A2E73',
  },
  joinButton: {
    flex: 1,
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
    fontSize: 20,
    fontWeight: '800',
    color: '#0A2E73',
    marginBottom: 6,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#22304D',
    marginBottom: 14,
  },
  helpContactLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: '#5E739B',
    marginBottom: 6,
  },
  helpContactValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 16,
  },
  helpActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  helpCallButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF3FC',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  helpCallButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A2E73',
  },
  helpWhatsAppButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0A2E73',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  helpWhatsAppButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
