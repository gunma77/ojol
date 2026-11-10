import { describe, expect, it } from '@jest/globals';

import { level01 } from '../../../data/levels';
import { compileProgram, countLoc } from '../compile';
import { tokenize } from '../lexer';

describe('compiler engine', () => {
  it('tokenizes commands, line breaks, comments, and blank lines', () => {
    expect(tokenize('\nmaju(3) # route\n')).toEqual([
      { type: 'NEWLINE', value: '\n', line: 1 },
      { type: 'IDENTIFIER', value: 'maju', line: 2 },
      { type: 'PUNCTUATION', value: '(', line: 2 },
      { type: 'NUMBER', value: '3', line: 2 },
      { type: 'PUNCTUATION', value: ')', line: 2 },
      { type: 'NEWLINE', value: '\n', line: 2 },
      { type: 'EOF', value: '', line: 3 },
    ]);
  });

  it('reports an unknown character on its source line', () => {
    let thrown: unknown;
    try {
      tokenize('maju(1)\n@');
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toMatchObject({ code: 'E01', line: 2 });
  });

  it('runs a valid route through the level graph', () => {
    const result = compileProgram('maju(2)\nbelokKanan()\nmaju(1);', level01);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.reachedGoal).toBe(true);
    expect(result.trajectory.map((step) => step.action)).toEqual([
      'MOVE',
      'MOVE',
      'TURN',
      'MOVE',
    ]);
    expect(result.finalNode).toBe('D');
    expect(result.loc).toBe(3);
  });

  it('reports line-aware errors for unknown commands and invalid movement values', () => {
    const unknownCommand = compileProgram('maju(1)\nMaju(2)', level01);
    const invalidDistance = compileProgram('mundur(100)', level01);

    expect(unknownCommand.ok).toBe(false);
    expect(invalidDistance.ok).toBe(false);
    if (!unknownCommand.ok && !invalidDistance.ok) {
      expect(unknownCommand.error.line).toBe(2);
      expect(unknownCommand.error.code).toBe('E02');
      expect(invalidDistance.error.code).toBe('E06');
    }
  });

  it('requires one statement per line and enforces the execution limit', () => {
    const sameLine = compileProgram('maju(1); belokKanan()', level01);
    const overLimit = compileProgram('maju(1)\nbelokKanan()', {
      ...level01,
      max_statements: 1,
    });

    expect(sameLine.ok).toBe(false);
    expect(overLimit.ok).toBe(false);
    if (!sameLine.ok && !overLimit.ok) {
      expect(sameLine.error.code).toBe('E08');
      expect(overLimit.error).toMatchObject({ code: 'E07', line: 2 });
    }
  });

  it('stops at a road gap and keeps the last valid position', () => {
    const result = compileProgram('putarBalik()\nmaju(1)', level01);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.crashed).toBe(true);
    expect(result.trajectory.at(-1)).toMatchObject({
      action: 'CRASH',
      nodeId: 'A',
    });
  });

  it('counts only lines containing statements', () => {
    expect(countLoc('maju(1); # one\n\n# note\nbelokKanan()')).toBe(2);
  });

  it('compiles a 50-statement program within the 100 ms target', () => {
    const script = Array.from({ length: 50 }, () => 'belokKanan()').join('\n');
    const startedAt = performance.now();
    const result = compileProgram(script, level01);

    expect(result.ok).toBe(true);
    expect(performance.now() - startedAt).toBeLessThan(100);
  });
});
