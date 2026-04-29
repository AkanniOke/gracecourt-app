import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { FadeInView } from '@/components/fade-in-view';
import { InteractivePressable } from '@/components/interactive-pressable';
import { supabase } from '@/lib/supabase';

const churchLogo = require('@/assets/images/logo.png.png');
const churchImage = require('@/assets/images/church.jpg');

const COLORS = {
  background: '#0A2E73',
  surface: '#FFFFFF',
  textPrimary: '#111111',
  textMuted: '#6F7E97',
  textSoft: '#5E739B',
  border: '#D7E2F7',
  cardTint: '#F6F8FD',
  iconTint: '#E9F0FB',
};

const RADIUS = {
  card: 24,
  media: 20,
  action: 18,
  pill: 21,
};

const SPACING = {
  screenX: 24,
  screenTop: 14,
  screenBottom: 16,
  cardY: 22,
  cardX: 24,
  logoBottom: 6,
  titleToCaption: 4,
  section: 16,
  grid: 12,
  iconBottom: 8,
};

type MonthlyThemeRecord = {
  month: string | null;
  theme: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const [isThemeLoading, setIsThemeLoading] = useState(true);
  const [monthlyTheme, setMonthlyTheme] = useState<MonthlyThemeRecord | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadMonthlyTheme = async () => {
      try {
        const { data, error } = await supabase
          .from('monthly_theme')
          .select('month, theme, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!mounted) {
          return;
        }

        if (error) {
          throw error;
        }

        if (!data?.theme?.trim()) {
          setMonthlyTheme(null);
          return;
        }

        setMonthlyTheme({
          month: data.month?.trim() || null,
          theme: data.theme.trim(),
        });
      } catch (error) {
        console.error('Failed to load monthly theme.', error);

        if (mounted) {
          setMonthlyTheme(null);
        }
      } finally {
        if (mounted) {
          setIsThemeLoading(false);
        }
      }
    };

    void loadMonthlyTheme();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FadeInView style={styles.card}>
          <Image source={churchLogo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>GraceCourt Global</Text>
          <Text style={styles.caption}>the haven of influence</Text>

          {isThemeLoading ? (
            <View style={styles.themeBannerShell}>
              <View style={styles.themeBannerGlow} />
              <Text style={styles.themeLabel}>THEME OF THE MONTH</Text>
              <View style={styles.themeSkeletonLineWide} />
              <View style={styles.themeSkeletonLineShort} />
            </View>
          ) : monthlyTheme ? (
            <View style={styles.themeBanner}>
              <View style={styles.themeBannerGlow} />
              <View style={styles.themeLabelPill}>
                <Text style={styles.themeLabel}>THEME OF THE MONTH</Text>
              </View>
              <Text style={styles.themeText}>{monthlyTheme.theme}</Text>
              {monthlyTheme.month ? (
                <Text style={styles.themeMonthText}>{monthlyTheme.month}</Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.imageFrame}>
            <Image source={churchImage} style={styles.churchImage} resizeMode="cover" />
          </View>

          <View style={styles.actionGroup}>
            <InteractivePressable
              accessibilityRole="button"
              onPress={() => router.push('/daily-prayer')}
              scaleTo={0.98}
              style={styles.prayerButton}>
              <Ionicons name="book-outline" size={18} color="#FFFFFF" />
              <Text style={styles.prayerButtonText}>Open Daily Prayer</Text>
            </InteractivePressable>

            <View style={styles.secondaryGrid}>
              <InteractivePressable
                accessibilityRole="button"
                onPress={() => router.push('/prayer-request')}
                style={styles.requestCard}>
                <View style={styles.requestIconWrap}>
                  <Ionicons name="heart-outline" size={20} color="#0A2E73" />
                </View>
                <Text adjustsFontSizeToFit numberOfLines={1} style={styles.requestCardTitle}>
                  Prayer Request
                </Text>
              </InteractivePressable>

              <InteractivePressable
                accessibilityRole="button"
                onPress={() => router.push('/fff-centres')}
                style={styles.requestCard}>
                <View style={styles.requestIconWrap}>
                  <Ionicons name="location-outline" size={20} color="#0A2E73" />
                </View>
                <Text adjustsFontSizeToFit numberOfLines={1} style={styles.requestCardTitle}>
                  FFF Centres
                </Text>
              </InteractivePressable>
            </View>
          </View>
        </FadeInView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.screenTop,
    paddingBottom: SPACING.screenBottom,
    backgroundColor: COLORS.background,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    paddingTop: SPACING.cardY,
    paddingBottom: SPACING.cardY,
    paddingHorizontal: SPACING.cardX,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 26,
    elevation: 7,
  },
  logo: {
    width: 88,
    height: 88,
    marginBottom: SPACING.logoBottom,
  },
  title: {
    fontSize: 29,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSoft,
    textAlign: 'center',
    marginTop: SPACING.titleToCaption,
    marginBottom: 12,
  },
  themeBanner: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: COLORS.background,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.section,
    overflow: 'hidden',
    shadowColor: COLORS.background,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 6,
  },
  themeBannerShell: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: '#18428E',
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.section,
    overflow: 'hidden',
    shadowColor: COLORS.background,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 5,
  },
  themeBannerGlow: {
    position: 'absolute',
    top: -42,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  themeLabelPill: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: RADIUS.pill,
    paddingVertical: 7,
    paddingHorizontal: 13,
    marginBottom: 12,
  },
  themeLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: COLORS.surface,
    textAlign: 'center',
  },
  themeText: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: COLORS.surface,
    textAlign: 'center',
  },
  themeMonthText: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
    marginTop: 8,
  },
  themeSkeletonLineWide: {
    width: '88%',
    height: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginTop: 14,
  },
  themeSkeletonLineShort: {
    width: '34%',
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    marginTop: 10,
  },
  imageFrame: {
    width: '100%',
    borderRadius: RADIUS.media,
    overflow: 'hidden',
    marginBottom: SPACING.section,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },
  churchImage: {
    width: '100%',
    height: 158,
  },
  actionGroup: {
    width: '100%',
    gap: 12,
  },
  prayerButton: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.action,
    paddingVertical: 14,
    paddingHorizontal: 22,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.background,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 4,
  },
  prayerButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryGrid: {
    width: '100%',
    flexDirection: 'row',
    gap: SPACING.grid,
  },
  requestCard: {
    flex: 1,
    borderRadius: RADIUS.action,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardTint,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 102,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  requestIconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.iconTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.iconBottom,
  },
  requestCardTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    width: '100%',
  },
});
