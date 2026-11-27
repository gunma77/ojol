import { describe, expect, it } from '@jest/globals';

import { level01 } from '../../data/levels';
import { compileProgram } from '../compiler/compile';
import { scoreResult } from '../scoring';

const scoringLevel = {
  ...level01,
  optimal_loc: 1,
  goal: 'D',
  nodes: {
    A: [107.607, -6.9215] as [number, number],
    B: [107.608, -6.9215] as [number, number],
    C: [107.609, -6.9215] as [number, number],
    D: [107.61, -6.9215] as [number, number],
  },
  edges: [
    { from: 'A', to: 'B', bearing: 90 },
    { from: 'B', to: 'C', bearing: 90 },
    { from: 'C', to: 'D', bearing: 90 },
  ],
};

describe('scoreResult', () => {
  it('awards stars at the configured LOC thresholds only when the goal is reached', () => {
    const threeStars = compileProgram('maju(3)', scoringLevel);
    const twoStars = compileProgram('maju(1)\nmaju(2)', scoringLevel);
    const oneStar = compileProgram('maju(1)\nmaju(1)\nmaju(1)', scoringLevel);

    expect(scoreResult(threeStars, scoringLevel)).toBe(3);
    expect(scoreResult(twoStars, scoringLevel)).toBe(2);
    expect(scoreResult(oneStar, scoringLevel)).toBe(1);
  });

  it('awards zero stars for compilation errors, crashes, or incomplete routes', () => {
    const syntaxError = compileProgram('maju()', scoringLevel);
    const crash = compileProgram('putarBalik()\nmaju(1)', scoringLevel);
    const incomplete = compileProgram('maju(1)', scoringLevel);

    expect(scoreResult(syntaxError, scoringLevel)).toBe(0);
    expect(scoreResult(crash, scoringLevel)).toBe(0);
    expect(scoreResult(incomplete, scoringLevel)).toBe(0);
  });

  it('uses level-specific thresholds when configured', () => {
    const customLevel = {
      ...scoringLevel,
      star_thresholds: { three: 0, two: 3 },
    };
    const result = compileProgram('maju(3)', scoringLevel);

    expect(scoreResult(result, customLevel)).toBe(2);
  });
});
