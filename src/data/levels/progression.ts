import type { LevelData } from '@/engine/compiler/types';

import type { ProgressMap } from '@/store/progress';

export function isLevelUnlocked(
  levels: LevelData[],
  progress: ProgressMap,
  levelIndex: number,
): boolean {
  if (levelIndex === 0) {
    return true;
  }

  const level = levels[levelIndex];
  if (!level) {
    return false;
  }

  if (progress[level.level_id]?.unlocked) {
    return true;
  }

  const previousLevel = levels[levelIndex - 1];
  return previousLevel !== undefined && (progress[previousLevel.level_id]?.stars ?? 0) > 0;
}
