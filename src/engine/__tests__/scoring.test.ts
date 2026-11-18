import { describe, expect, it } from '@jest/globals';

import { level01 } from '../../data/levels';
import { compileProgram } from '../compiler/compile';
import { scoreResult } from '../scoring';

describe('scoreResult', () => {
  it('awards stars at the configured LOC thresholds only when the goal is reached', () => {
    const threeStars = compileProgram('maju(2)\nbelokKanan()\nmaju(1)', level01);
    const twoStars = compileProgram(
      'maju(1)\nmaju(1)\nbelokKanan()\nmaju(1)',
      level01,
    );
    const oneStar = compileProgram(
      'maju(2)\nbelokKanan()\nbelokKiri()\nbelokKanan()\nbelokKiri()\nbelokKanan()\nbelokKiri()\nbelokKanan()\nmaju(1)',
      level01,
    );

    expect(scoreResult(threeStars, level01)).toBe(3);
    expect(scoreResult(twoStars, level01)).toBe(2);
    expect(scoreResult(oneStar, level01)).toBe(1);
  });

  it('awards zero stars for compilation errors, crashes, or incomplete routes', () => {
    const syntaxError = compileProgram('maju()', level01);
    const crash = compileProgram('putarBalik()\nmaju(1)', level01);
    const incomplete = compileProgram('maju(1)', level01);

    expect(scoreResult(syntaxError, level01)).toBe(0);
    expect(scoreResult(crash, level01)).toBe(0);
    expect(scoreResult(incomplete, level01)).toBe(0);
  });

  it('uses level-specific thresholds when configured', () => {
    const customLevel = {
      ...level01,
      optimal_loc: 1,
      star_thresholds: { three: 2, two: 3 },
    };
    const result = compileProgram('maju(2)\nbelokKanan()\nmaju(1)', level01);

    expect(scoreResult(result, customLevel)).toBe(2);
  });
});
