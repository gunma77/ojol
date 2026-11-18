import type { CompileResult, LevelData } from './compiler/types';

export type StarRating = 0 | 1 | 2 | 3;

export function scoreResult(result: CompileResult, level: LevelData): StarRating {
  if (!result.ok || result.crashed || !result.reachedGoal) {
    return 0;
  }

  const threeStarThreshold = level.star_thresholds?.three ?? level.optimal_loc;
  const twoStarThreshold =
    level.star_thresholds?.two ?? Math.ceil(level.optimal_loc * 1.5);

  if (
    !Number.isInteger(threeStarThreshold) ||
    !Number.isInteger(twoStarThreshold) ||
    threeStarThreshold < 0 ||
    twoStarThreshold < threeStarThreshold
  ) {
    throw new Error(`Invalid star thresholds for level ${level.level_id}.`);
  }

  if (result.loc <= threeStarThreshold) {
    return 3;
  }
  if (result.loc <= twoStarThreshold) {
    return 2;
  }
  return 1;
}
