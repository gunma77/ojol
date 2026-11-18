import { describe, expect, it } from '@jest/globals';

import { level01 } from '..';
import { isLevelUnlocked } from '../progression';

describe('isLevelUnlocked', () => {
  const secondLevel = { ...level01, level_id: 'lvl_02' };

  it('keeps the first level available and locks later levels until the previous one is completed', () => {
    const levels = [level01, secondLevel];

    expect(isLevelUnlocked(levels, {}, 0)).toBe(true);
    expect(isLevelUnlocked(levels, {}, 1)).toBe(false);
    expect(
      isLevelUnlocked(levels, { lvl_01: { stars: 1, unlocked: true } }, 1),
    ).toBe(true);
  });

  it('rejects indexes outside the level list', () => {
    expect(isLevelUnlocked([level01], {}, 1)).toBe(false);
  });
});
