import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { LevelListScreen } from '@/components/level/LevelListScreen';
import { GameScreen } from '@/components/game/GameScreen';
import { levels } from '@/data/levels';
import type { StarRating } from '@/engine/scoring';
import { loadDraft, loadProgress, saveDraft, saveProgress, type ProgressMap } from '@/store/progress';

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Kesalahan penyimpanan yang tidak diketahui.';
}

export default function HomeScreen() {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadSavedData() {
      setLoading(true);
      setLoadError(null);
      try {
        const [savedProgress, ...savedDrafts] = await Promise.all([
          loadProgress(),
          ...levels.map((level) => loadDraft(level.level_id)),
        ]);
        if (!active) {
          return;
        }
        setProgress(savedProgress);
        setDrafts(
          Object.fromEntries(
            levels.flatMap((level, index) => {
              const draft = savedDrafts[index];
              return draft === null || draft === undefined ? [] : [[level.level_id, draft]];
            }),
          ),
        );
      } catch (error) {
        if (active) {
          setLoadError(`Tidak dapat memuat progres atau draf: ${errorMessage(error)}`);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSavedData();
    return () => {
      active = false;
    };
  }, [loadAttempt]);

  const handleDraftChange = useCallback((levelId: string, draft: string) => {
    setDrafts((current) => ({ ...current, [levelId]: draft }));
    void saveDraft(levelId, draft).catch((error: unknown) => {
      setPersistenceError(`Tidak dapat menyimpan draf: ${errorMessage(error)}`);
    });
  }, []);

  const handleComplete = useCallback(
    (levelId: string, stars: 1 | 2 | 3) => {
      const currentLevelIndex = levels.findIndex((level) => level.level_id === levelId);
      if (currentLevelIndex < 0) {
        return;
      }

      const previousStars: StarRating = progress[levelId]?.stars ?? 0;
      const nextProgress: ProgressMap = {
        ...progress,
        [levelId]: {
          stars: previousStars > stars ? previousStars : stars,
          unlocked: true,
        },
      };
      const nextLevel = levels[currentLevelIndex + 1];
      if (nextLevel) {
        nextProgress[nextLevel.level_id] = {
          stars: progress[nextLevel.level_id]?.stars ?? 0,
          unlocked: true,
        };
      }

      setProgress(nextProgress);
      void saveProgress(nextProgress).catch((error: unknown) => {
        setPersistenceError(`Tidak dapat menyimpan progres: ${errorMessage(error)}`);
      });
    },
    [progress],
  );

  if (loading) {
    return (
      <View style={styles.messageScreen}>
        <ActivityIndicator color="#177245" />
        <Text style={styles.messageText}>Memuat progres…</Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.messageScreen}>
        <Text style={styles.errorTitle}>Penyimpanan belum tersedia</Text>
        <Text style={styles.messageText}>{loadError}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setLoadAttempt((attempt) => attempt + 1)}
          style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Coba lagi</Text>
        </Pressable>
      </View>
    );
  }

  const selectedLevel = levels.find((level) => level.level_id === selectedLevelId);
  if (selectedLevel) {
    return (
      <GameScreen
        level={selectedLevel}
        initialScript={drafts[selectedLevel.level_id]}
        savedStars={progress[selectedLevel.level_id]?.stars ?? 0}
        persistenceError={persistenceError}
        onBackToLevels={() => setSelectedLevelId(null)}
        onComplete={handleComplete}
        onDraftChange={handleDraftChange}
      />
    );
  }

  return (
    <LevelListScreen
      progress={progress}
      persistenceError={persistenceError}
      onSelectLevel={setSelectedLevelId}
    />
  );
}

const styles = StyleSheet.create({
  messageScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: '#f7f9f7',
  },
  messageText: {
    color: '#59665f',
    fontSize: 14,
    textAlign: 'center',
  },
  errorTitle: {
    color: '#a32020',
    fontSize: 18,
    fontWeight: '800',
  },
  retryButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#177245',
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '800',
  },
});
