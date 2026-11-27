import { describe, expect, it } from '@jest/globals';

import { level01, levels } from '../../../data/levels';
import bandungRoadData from '../../../data/maps/bandung-roads.json';
import { compileProgram, countLoc } from '../compile';
import { tokenize } from '../lexer';
import type { LevelData } from '../types';

describe('compiler engine', () => {
  const isNearOfflineRoad = (longitude: number, latitude: number) => {
    const metersPerLongitude = 111_320 * Math.cos((latitude * Math.PI) / 180);
    const toMeters = (coordinate: number[]) => [
      (coordinate[0] - longitude) * metersPerLongitude,
      (coordinate[1] - latitude) * 110_540,
    ];

    return bandungRoadData.features.some((feature) => {
      const coordinates = feature.geometry.coordinates;

      return coordinates.slice(1).some((end, index) => {
        const [startX, startY] = toMeters(coordinates[index]);
        const [endX, endY] = toMeters(end);
        const segmentX = endX - startX;
        const segmentY = endY - startY;
        const segmentLengthSquared = segmentX ** 2 + segmentY ** 2;
        const position =
          segmentLengthSquared === 0
            ? 0
            : Math.max(
                0,
                Math.min(
                  1,
                  (-(startX * segmentX + startY * segmentY)) / segmentLengthSquared,
                ),
              );
        const distance = Math.hypot(
          startX + position * segmentX,
          startY + position * segmentY,
        );

        return distance <= 5;
      });
    });
  };

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
    const result = compileProgram('maju(1)', level01);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.reachedGoal).toBe(true);
    expect(result.trajectory.map((step) => step.action)).toEqual(['MOVE']);
    expect(result.finalNode).toBe('B');
    expect(result.loc).toBe(1);
    expect(result.trajectory[0].geometry).toHaveLength(11);
  });

  it('runs the Bandung OSM routes and preserves road geometry in each movement', () => {
    const scripts: Record<string, string> = {
      lvl_01: 'maju(1)',
      lvl_02: 'maju(1)\nbelokKiri()\nmaju(1)',
      lvl_03: 'maju(1)\njika(adaJalanDiKiri) {\n belokKiri()\n maju(1)\n}',
      lvl_04:
        'maju(1)\njika(adaJalanDiKiri) {\n belokKiri()\n maju(1)\n jika(adaJalanDiKanan) {\n  belokKanan()\n  maju(1)\n  belokKiri()\n  maju(1)\n }\n}',
      lvl_05: 'ulang(3) {\n maju(1)\n}',
      lvl_06: 'selama(adaJalanDiDepan) {\n maju(1)\n}',
    };

    for (const level of levels) {
      const result = compileProgram(scripts[level.level_id], level);

      if (!result.ok) {
        throw new Error(`${level.level_id}: ${result.error.message}`);
      }
      expect(result.reachedGoal).toBe(true);
      expect(result.finalNode).toBe(level.goal);
      expect(
        result.trajectory
          .filter((step) => step.action === 'MOVE')
          .every((step) => (step.geometry?.length ?? 0) >= 2),
      ).toBe(true);
      for (const edge of level.edges) {
        for (const [longitude, latitude] of edge.geometry ?? []) {
          if (!isNearOfflineRoad(longitude, latitude)) {
            throw new Error(
              `${level.level_id} ${edge.name} is more than 5m from OSM roads at ${longitude},${latitude}`,
            );
          }
        }
      }
    }
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

  it('executes repeat block (ulang) and if block (jika)', () => {
    const level05: LevelData = {
      level_id: 'lvl_05',
      title: 'Perulangan Pasti (ulang)',
      mission: 'Test route',
      start_label: 'Start',
      goal_label: 'Goal',
      allowed_commands: ['maju', 'belokKanan', 'belokKiri'],
      optimal_loc: 4,
      start: { node: 'A', bearing: 90 },
      goal: 'D',
      nodes: {
        A: [107.607, -6.9215] as [number, number],
        B: [107.608, -6.9215] as [number, number],
        C: [107.609, -6.9215] as [number, number],
        D: [107.610, -6.9215] as [number, number],
      },
      edges: [
        { from: 'A', to: 'B', bearing: 90 },
        { from: 'B', to: 'C', bearing: 90 },
        { from: 'C', to: 'D', bearing: 90 },
      ],
    };
    const result = compileProgram('ulang(3) {\n maju(1)\n}', level05);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.reachedGoal).toBe(true);
    expect(result.finalNode).toBe('D');
  });

  it('prevents infinite loops during execution', () => {
    const script = 'selama(adaJalanDiDepan) {\n belokKanan()\n belokKiri()\n}';
    const result = compileProgram(script, level01);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('E07');
    }
  });
});
