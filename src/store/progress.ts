import AsyncStorage from '@react-native-async-storage/async-storage';

import type { StarRating } from '@/engine/scoring';

const progressKey = 'codepath/progress';

export interface LevelProgress {
  stars: StarRating;
  unlocked: boolean;
}

export type ProgressMap = Record<string, LevelProgress>;

function isProgressMap(value: unknown): value is ProgressMap {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every((entry) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      return false;
    }

    const progress = entry as Record<string, unknown>;
    return (
      Number.isInteger(progress.stars) &&
      Number(progress.stars) >= 0 &&
      Number(progress.stars) <= 3 &&
      typeof progress.unlocked === 'boolean'
    );
  });
}

export async function loadProgress(): Promise<ProgressMap> {
  const stored = await AsyncStorage.getItem(progressKey);
  if (stored === null) {
    return {};
  }

  const parsed: unknown = JSON.parse(stored);
  if (!isProgressMap(parsed)) {
    throw new Error('Data progres tersimpan tidak valid.');
  }

  return parsed;
}

export function saveProgress(progress: ProgressMap): Promise<void> {
  return AsyncStorage.setItem(progressKey, JSON.stringify(progress));
}

function draftKey(levelId: string) {
  return `codepath/draft/${levelId}`;
}

export function loadDraft(levelId: string): Promise<string | null> {
  return AsyncStorage.getItem(draftKey(levelId));
}

export function saveDraft(levelId: string, draft: string): Promise<void> {
  return AsyncStorage.setItem(draftKey(levelId), draft);
}
