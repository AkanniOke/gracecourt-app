import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { File } from 'expo-file-system';

import { FadeInView } from '@/components/fade-in-view';
import { InteractivePressable } from '@/components/interactive-pressable';
import {
  GraceCourtColors,
  GraceCourtRadius,
  GraceCourtShadows,
  GraceCourtSpacing,
} from '@/constants/gracecourt-ui';
import type { Sermon } from '@/data/sermons';
import {
  DOWNLOADED_SERMONS_DIRECTORY,
  DOWNLOADED_SERMONS_STORAGE_KEY,
  FAVORITE_SERMONS_STORAGE_KEY,
  FIXED_PASTOR_NAME,
  formatSermonDate,
  getDownloadFileExtension,
} from '@/lib/sermons';
import { supabase } from '@/lib/supabase';

const SERMON_SUMMARY_PLACEHOLDER =
  'A focused message on living with conviction, faith, and steady confidence in God through every season.';
const SCRIPTURE_REFERENCE_PLACEHOLDER = 'Scripture Focus: Romans 12:2, Hebrews 11:1';
const SEEK_INTERVAL_SECONDS = 10;

function clampPlaybackTime(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function formatPlaybackTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '00:00';
  }

  const roundedSeconds = Math.floor(seconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const remainingSeconds = roundedSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

export default function SermonDetailScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    title?: string | string[];
    date?: string | string[];
    mediaUrl?: string | string[];
  }>();
  const router = useRouter();
  const sermonId = typeof params.id === 'string' ? params.id : '';
  const initialTitle = typeof params.title === 'string' ? params.title : '';
  const initialDate = typeof params.date === 'string' ? params.date : '';
  const initialMediaUrl =
    typeof params.mediaUrl === 'string' && params.mediaUrl.length > 0 ? params.mediaUrl : null;
  const [sermon, setSermon] = useState<Sermon | null>(
    sermonId
      ? {
          id: sermonId,
          title: initialTitle,
          speaker: FIXED_PASTOR_NAME,
          date: initialDate,
          mediaUrl: initialMediaUrl,
        }
      : null
  );
  const [isLoading, setIsLoading] = useState(!initialTitle || !initialDate);
  const [favoriteSermonIds, setFavoriteSermonIds] = useState<string[]>([]);
  const [downloadedSermons, setDownloadedSermons] = useState<Record<string, string>>({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [loadedPlaybackSource, setLoadedPlaybackSource] = useState<string | null>(null);
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const playerStatus = useAudioPlayerStatus(player);

  useEffect(() => {
    // Background playback is supported where the platform and app configuration allow it.
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch((error) => {
      console.error('Failed to configure audio mode.', error);
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadFavoriteSermons = async () => {
      try {
        const storedFavorites = await AsyncStorage.getItem(FAVORITE_SERMONS_STORAGE_KEY);

        if (!mounted || !storedFavorites) {
          return;
        }

        const parsedFavorites = JSON.parse(storedFavorites);

        if (Array.isArray(parsedFavorites)) {
          setFavoriteSermonIds(parsedFavorites.filter((id): id is string => typeof id === 'string'));
        }
      } catch (error) {
        console.error('Failed to load favorite sermons.', error);
      }
    };

    loadFavoriteSermons();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadDownloadedSermons = async () => {
      try {
        const storedDownloadedSermons = await AsyncStorage.getItem(DOWNLOADED_SERMONS_STORAGE_KEY);

        if (!mounted || !storedDownloadedSermons) {
          return;
        }

        const parsedDownloadedSermons = JSON.parse(storedDownloadedSermons);

        if (!parsedDownloadedSermons || Array.isArray(parsedDownloadedSermons)) {
          return;
        }

        const verifiedDownloadedSermons = Object.entries(parsedDownloadedSermons).reduce<
          Record<string, string>
        >((accumulator, [storedSermonId, localFilePath]) => {
          if (typeof storedSermonId !== 'string' || typeof localFilePath !== 'string') {
            return accumulator;
          }

          try {
            const downloadedFile = new File(localFilePath);

            if (downloadedFile.exists) {
              accumulator[storedSermonId] = localFilePath;
            }
          } catch (error) {
            console.error('Failed to verify downloaded sermon file.', error);
          }

          return accumulator;
        }, {});

        if (mounted) {
          setDownloadedSermons(verifiedDownloadedSermons);
        }

        if (
          Object.keys(verifiedDownloadedSermons).length !==
          Object.keys(parsedDownloadedSermons).length
        ) {
          await AsyncStorage.setItem(
            DOWNLOADED_SERMONS_STORAGE_KEY,
            JSON.stringify(verifiedDownloadedSermons)
          );
        }
      } catch (error) {
        console.error('Failed to load downloaded sermons.', error);
      }
    };

    loadDownloadedSermons();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const shouldFetchSermon = Boolean(sermonId) && (!initialTitle || !initialDate);

    if (!shouldFetchSermon) {
      setIsLoading(false);
      return () => {
        mounted = false;
      };
    }

    const loadSermon = async () => {
      try {
        const { data, error } = await supabase
          .from('sermons')
          .select('id, title, speaker, date, media_url')
          .eq('id', sermonId)
          .single();

        if (error) {
          throw error;
        }

        if (mounted && data) {
          setSermon({
            id: String(data.id),
            title: data.title,
            speaker: FIXED_PASTOR_NAME,
            date: formatSermonDate(data.date),
            mediaUrl: data.media_url ?? null,
          });
        }
      } catch (error) {
        console.error('Failed to load sermon detail from Supabase.', error);

        if (mounted) {
          setSermon(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadSermon();

    return () => {
      mounted = false;
    };
  }, [initialDate, initialTitle, sermonId]);

  useEffect(() => {
    if (playerStatus.didJustFinish) {
      void player.seekTo(0).catch((error) => {
        console.error('Failed to reset sermon playback position.', error);
      });
    }
  }, [player, playerStatus.didJustFinish]);

  const isFavorited = sermon ? favoriteSermonIds.includes(sermon.id) : false;
  const downloadedFilePath = sermon ? downloadedSermons[sermon.id] : undefined;
  const playbackSource = downloadedFilePath ?? sermon?.mediaUrl ?? null;
  const isBuffering = playerStatus.isBuffering;
  const isPlaying = playerStatus.playing;
  const showPauseButton = playerStatus.playing || playerStatus.isBuffering;
  const currentPlaybackTime = Number.isFinite(playerStatus.currentTime) ? playerStatus.currentTime : 0;
  const playbackDuration = Number.isFinite(playerStatus.duration) ? playerStatus.duration : 0;
  const playbackProgress = playbackDuration > 0 ? currentPlaybackTime / playbackDuration : 0;

  const handleTogglePlayback = () => {
    if (!sermon || !playbackSource) {
      return;
    }

    try {
      if (showPauseButton) {
        player.pause();
        return;
      }

      if (loadedPlaybackSource !== playbackSource) {
        player.replace(playbackSource);
        setLoadedPlaybackSource(playbackSource);
      }

      if (playerStatus.didJustFinish) {
        void player.seekTo(0).catch((error) => {
          console.error('Failed to restart sermon playback.', error);
        });
      }

      player.play();
    } catch (error) {
      console.error('Failed to toggle sermon playback.', error);
    }
  };

  const handleSeekBy = async (seconds: number) => {
    if (!playbackSource) {
      return;
    }

    try {
      if (loadedPlaybackSource !== playbackSource) {
        player.replace(playbackSource);
        setLoadedPlaybackSource(playbackSource);
      }

      const nextPlaybackTime =
        playbackDuration > 0
          ? clampPlaybackTime(currentPlaybackTime + seconds, 0, playbackDuration)
          : Math.max(currentPlaybackTime + seconds, 0);

      await player.seekTo(nextPlaybackTime);
    } catch (error) {
      console.error('Failed to seek sermon playback.', error);
    }
  };

  const handleShareSermon = async () => {
    if (!sermon) {
      return;
    }

    const shareLines = [
      sermon.title,
      `Pastor: ${FIXED_PASTOR_NAME}`,
      `Date: ${sermon.date}`,
      ...(sermon.mediaUrl ? [`Link: ${sermon.mediaUrl}`] : []),
    ];

    try {
      await Share.share({
        title: sermon.title,
        message: shareLines.join('\n'),
      });
    } catch (error) {
      console.error('Failed to share sermon.', error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!sermon) {
      return;
    }

    const nextFavoriteSermonIds = favoriteSermonIds.includes(sermon.id)
      ? favoriteSermonIds.filter((id) => id !== sermon.id)
      : [...favoriteSermonIds, sermon.id];

    setFavoriteSermonIds(nextFavoriteSermonIds);

    try {
      await AsyncStorage.setItem(
        FAVORITE_SERMONS_STORAGE_KEY,
        JSON.stringify(nextFavoriteSermonIds)
      );
    } catch (error) {
      console.error('Failed to save favorite sermons.', error);
      setFavoriteSermonIds(favoriteSermonIds);
    }
  };

  const handleDownloadSermon = async () => {
    if (!sermon || !sermon.mediaUrl || isDownloading || downloadedSermons[sermon.id]) {
      return;
    }

    setIsDownloading(true);

    try {
      DOWNLOADED_SERMONS_DIRECTORY.create({ idempotent: true, intermediates: true });

      const destinationFile = new File(
        DOWNLOADED_SERMONS_DIRECTORY,
        `${sermon.id}${getDownloadFileExtension(sermon.mediaUrl)}`
      );

      const downloadedFile = await File.downloadFileAsync(sermon.mediaUrl, destinationFile, {
        idempotent: true,
      });

      const nextDownloadedSermons = {
        ...downloadedSermons,
        [sermon.id]: downloadedFile.uri,
      };

      setDownloadedSermons(nextDownloadedSermons);
      await AsyncStorage.setItem(
        DOWNLOADED_SERMONS_STORAGE_KEY,
        JSON.stringify(nextDownloadedSermons)
      );
    } catch (error) {
      console.error('Failed to download sermon.', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const playButtonLabel = !playbackSource ? 'Unavailable' : showPauseButton ? 'Pause' : 'Play';
  const playButtonIcon = showPauseButton ? 'pause' : 'play';
  const downloadLabel = !sermon?.mediaUrl
    ? 'Unavailable'
    : isDownloading
      ? 'Downloading...'
      : downloadedFilePath
        ? 'Downloaded'
        : 'Download';
  const downloadIcon = !sermon?.mediaUrl
    ? 'cloud-offline-outline'
    : downloadedFilePath
      ? 'download'
      : 'download-outline';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <FadeInView>
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <InteractivePressable
                accessibilityRole="button"
                activeOpacity={0.9}
                onPress={() => router.back()}
                scaleTo={0.96}
                style={styles.backButton}>
                <Ionicons name="arrow-back" size={20} color={GraceCourtColors.surface} />
              </InteractivePressable>

              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>Sermon Detail</Text>
              </View>
            </View>

            {isLoading ? (
              <View style={styles.heroLoadingWrap}>
                <Text style={styles.heroMetaText}>Loading sermon...</Text>
              </View>
            ) : sermon ? (
              <>
                <Text style={styles.heroTitle}>{sermon.title}</Text>
                <Text style={styles.heroPastor}>{FIXED_PASTOR_NAME}</Text>

                <View style={styles.heroMetaRow}>
                  <View style={styles.heroMetaChip}>
                    <Ionicons name="calendar-outline" size={14} color={GraceCourtColors.surface} />
                    <Text style={styles.heroMetaText}>{sermon.date}</Text>
                  </View>

                  {downloadedFilePath ? (
                    <View style={styles.heroMetaChip}>
                      <Ionicons name="download" size={14} color={GraceCourtColors.surface} />
                      <Text style={styles.heroMetaText}>Offline ready</Text>
                    </View>
                  ) : null}
                </View>
              </>
            ) : (
              <View style={styles.heroLoadingWrap}>
                <Text style={styles.heroMetaText}>This sermon could not be loaded right now.</Text>
              </View>
            )}
          </View>

          {sermon ? (
            <>
              <View style={styles.playerCard}>
                <Text style={styles.sectionLabel}>Audio Player</Text>
                <Text style={styles.playerHeading}>Listen to this message anytime</Text>
                <Text style={styles.playerStatus}>
                  {isBuffering
                    ? 'Buffering...'
                    : isPlaying
                      ? 'Playing'
                      : downloadedFilePath
                        ? 'Using downloaded audio'
                        : sermon.mediaUrl
                          ? 'Streaming or ready to play'
                          : 'Audio unavailable'}
                </Text>

                <View style={styles.progressSummaryRow}>
                  <Text style={styles.progressTimeText}>
                    {formatPlaybackTime(currentPlaybackTime)}
                  </Text>
                  <Text style={styles.progressTimeText}>
                    {formatPlaybackTime(playbackDuration)}
                  </Text>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.max(0, Math.min(playbackProgress, 1)) * 100}%` },
                    ]}
                  />
                </View>

                <View style={styles.transportRow}>
                  <InteractivePressable
                    accessibilityRole="button"
                    activeOpacity={playbackSource ? 0.92 : 1}
                    onPress={() => {
                      void handleSeekBy(-SEEK_INTERVAL_SECONDS);
                    }}
                    scaleTo={playbackSource ? 0.98 : 1}
                    style={[
                      styles.transportSecondaryButton,
                      !playbackSource && styles.secondaryActionDisabled,
                    ]}>
                    <Ionicons
                      name="play-back-outline"
                      size={20}
                      color={GraceCourtColors.accent}
                    />
                    <Text style={styles.transportSecondaryLabel}>-10s</Text>
                  </InteractivePressable>

                  <InteractivePressable
                    accessibilityRole="button"
                    activeOpacity={playbackSource ? 0.92 : 1}
                    onPress={handleTogglePlayback}
                    scaleTo={playbackSource ? 0.98 : 1}
                    style={[
                      styles.primaryPlayerButton,
                      styles.transportPrimaryButton,
                      !playbackSource && styles.secondaryActionDisabled,
                    ]}>
                    <Ionicons name={playButtonIcon} size={22} color={GraceCourtColors.surface} />
                    <Text style={styles.primaryPlayerLabel}>{playButtonLabel}</Text>
                  </InteractivePressable>

                  <InteractivePressable
                    accessibilityRole="button"
                    activeOpacity={playbackSource ? 0.92 : 1}
                    onPress={() => {
                      void handleSeekBy(SEEK_INTERVAL_SECONDS);
                    }}
                    scaleTo={playbackSource ? 0.98 : 1}
                    style={[
                      styles.transportSecondaryButton,
                      !playbackSource && styles.secondaryActionDisabled,
                    ]}>
                    <Ionicons
                      name="play-forward-outline"
                      size={20}
                      color={GraceCourtColors.accent}
                    />
                    <Text style={styles.transportSecondaryLabel}>+10s</Text>
                  </InteractivePressable>
                </View>
              </View>

              <View style={styles.actionsCard}>
                <Text style={styles.sectionLabel}>Actions</Text>

                <View style={styles.actionsRow}>
                  <InteractivePressable
                    accessibilityRole="button"
                    activeOpacity={0.92}
                    onPress={handleShareSermon}
                    scaleTo={0.98}
                    style={styles.secondaryAction}>
                    <Ionicons name="share-social-outline" size={18} color={GraceCourtColors.accent} />
                    <Text style={styles.secondaryActionLabel}>Share</Text>
                  </InteractivePressable>

                  <InteractivePressable
                    accessibilityRole="button"
                    activeOpacity={0.92}
                    onPress={handleToggleFavorite}
                    scaleTo={0.98}
                    style={[styles.secondaryAction, isFavorited && styles.favoriteActionActive]}>
                    <Ionicons
                      name={isFavorited ? 'bookmark' : 'bookmark-outline'}
                      size={18}
                      color={isFavorited ? GraceCourtColors.surface : GraceCourtColors.accent}
                    />
                    <Text
                      style={[
                        styles.secondaryActionLabel,
                        isFavorited && styles.favoriteActionLabelActive,
                      ]}>
                      {isFavorited ? 'Saved' : 'Save'}
                    </Text>
                  </InteractivePressable>

                  <InteractivePressable
                    accessibilityRole="button"
                    activeOpacity={!sermon.mediaUrl || isDownloading || downloadedFilePath ? 1 : 0.92}
                    onPress={handleDownloadSermon}
                    scaleTo={!sermon.mediaUrl || isDownloading || downloadedFilePath ? 1 : 0.98}
                    style={[
                      styles.secondaryAction,
                      (!sermon.mediaUrl || isDownloading) && styles.secondaryActionDisabled,
                      downloadedFilePath && styles.downloadActionActive,
                    ]}>
                    <Ionicons
                      name={downloadIcon}
                      size={18}
                      color={downloadedFilePath ? GraceCourtColors.surface : GraceCourtColors.accent}
                    />
                    <Text
                      style={[
                        styles.secondaryActionLabel,
                        downloadedFilePath && styles.downloadActionLabelActive,
                      ]}>
                      {downloadLabel}
                    </Text>
                  </InteractivePressable>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.sectionLabel}>Overview</Text>
                <Text style={styles.infoHeading}>Summary</Text>
                <Text style={styles.infoText}>{SERMON_SUMMARY_PLACEHOLDER}</Text>
                <Text style={styles.infoHeading}>Scripture Reference</Text>
                <Text style={styles.infoText}>{SCRIPTURE_REFERENCE_PLACEHOLDER}</Text>
              </View>
            </>
          ) : null}
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
    gap: GraceCourtSpacing.stack,
  },
  heroCard: {
    backgroundColor: GraceCourtColors.accent,
    borderRadius: GraceCourtRadius.card,
    padding: GraceCourtSpacing.cardPadding,
    ...GraceCourtShadows.accent,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: GraceCourtRadius.icon,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: {
    borderRadius: GraceCourtRadius.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: GraceCourtColors.surface,
  },
  heroLoadingWrap: {
    paddingBottom: 18,
  },
  heroTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: GraceCourtColors.surface,
    marginBottom: 12,
  },
  heroPastor: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.88)',
    marginBottom: 22,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  heroMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: GraceCourtRadius.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  heroMetaText: {
    fontSize: 13,
    fontWeight: '600',
    color: GraceCourtColors.surface,
  },
  playerCard: {
    backgroundColor: GraceCourtColors.surface,
    borderRadius: GraceCourtRadius.card,
    padding: GraceCourtSpacing.cardPadding,
    ...GraceCourtShadows.card,
  },
  actionsCard: {
    backgroundColor: GraceCourtColors.surface,
    borderRadius: GraceCourtRadius.card,
    padding: GraceCourtSpacing.cardPadding,
    ...GraceCourtShadows.card,
  },
  infoCard: {
    backgroundColor: GraceCourtColors.surface,
    borderRadius: GraceCourtRadius.card,
    padding: GraceCourtSpacing.cardPadding,
    ...GraceCourtShadows.card,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: GraceCourtColors.accentSoft,
    marginBottom: 10,
  },
  playerHeading: {
    fontSize: 24,
    fontWeight: '800',
    color: GraceCourtColors.textPrimary,
    marginBottom: 10,
  },
  playerStatus: {
    fontSize: 15,
    lineHeight: 22,
    color: GraceCourtColors.textSecondary,
    marginBottom: 16,
  },
  progressSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: GraceCourtColors.accentSoft,
  },
  progressTrack: {
    height: 8,
    borderRadius: GraceCourtRadius.pill,
    backgroundColor: GraceCourtColors.tintSurface,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    borderRadius: GraceCourtRadius.pill,
    backgroundColor: GraceCourtColors.accent,
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  primaryPlayerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: GraceCourtColors.accent,
    borderRadius: GraceCourtRadius.pill,
    paddingVertical: 16,
    paddingHorizontal: 20,
    ...GraceCourtShadows.accent,
  },
  transportPrimaryButton: {
    flex: 1,
  },
  primaryPlayerLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: GraceCourtColors.surface,
  },
  transportSecondaryButton: {
    minWidth: 86,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: GraceCourtColors.tintSurface,
    borderRadius: GraceCourtRadius.pill,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  transportSecondaryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: GraceCourtColors.accent,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  secondaryAction: {
    minWidth: 104,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GraceCourtColors.tintSurface,
    borderRadius: GraceCourtRadius.pill,
    paddingVertical: 13,
    paddingHorizontal: 18,
  },
  secondaryActionDisabled: {
    opacity: 0.7,
  },
  secondaryActionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: GraceCourtColors.accent,
  },
  favoriteActionActive: {
    backgroundColor: GraceCourtColors.accent,
  },
  favoriteActionLabelActive: {
    color: GraceCourtColors.surface,
  },
  downloadActionActive: {
    backgroundColor: GraceCourtColors.accent,
  },
  downloadActionLabelActive: {
    color: GraceCourtColors.surface,
  },
  infoHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: GraceCourtColors.textPrimary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    lineHeight: 24,
    color: GraceCourtColors.textSecondary,
    marginBottom: 18,
  },
});
