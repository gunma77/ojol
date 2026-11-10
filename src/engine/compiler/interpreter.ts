import { EngineError, type LevelData, type Program, type TrajectoryStep } from './types';

const TURN_DEGREES = 90;
const ROAD_DIRECTION_TOLERANCE = 45;
const DEFAULT_MAX_STATEMENTS = 500;

function normalizeBearing(bearing: number) {
  return ((bearing % 360) + 360) % 360;
}

export function angularDistance(first: number, second: number) {
  const difference = Math.abs(normalizeBearing(first) - normalizeBearing(second));
  return Math.min(difference, 360 - difference);
}

export function interpret(program: Program, level: LevelData) {
  const maxStatements = level.max_statements ?? DEFAULT_MAX_STATEMENTS;
  if (program.body.length > maxStatements) {
    const line = program.body[maxStatements]?.line ?? 0;
    throw new EngineError(
      'E07',
      line,
      line > 0
        ? `Baris ${line}: program berjalan terlalu lama. Batas perintah terlampaui.`
        : 'Program berjalan terlalu lama. Batas perintah terlampaui.',
    );
  }

  let nodeId = level.start.node;
  let bearing = normalizeBearing(level.start.bearing);
  let crashed = false;
  const trajectory: TrajectoryStep[] = [];

  const addStep = (action: TrajectoryStep['action'], line: number) => {
    trajectory.push({
      stepIndex: trajectory.length,
      action,
      coordinate: level.nodes[nodeId],
      bearing,
      nodeId,
      line,
    });
  };

  for (const statement of program.body) {
    if (statement.name === 'belokKanan') {
      bearing = normalizeBearing(bearing + TURN_DEGREES);
      addStep('TURN', statement.line);
      continue;
    }

    if (statement.name === 'belokKiri') {
      bearing = normalizeBearing(bearing - TURN_DEGREES);
      addStep('TURN', statement.line);
      continue;
    }

    if (statement.name === 'putarBalik') {
      bearing = normalizeBearing(bearing + 180);
      addStep('TURN', statement.line);
      continue;
    }

    const targetBearing =
      statement.name === 'mundur' ? normalizeBearing(bearing + 180) : bearing;
    const distance = statement.arguments[0];

    for (let step = 0; step < distance; step += 1) {
      const candidates = level.edges
        .filter((edge) => edge.from === nodeId)
        .map((edge) => ({
          edge,
          difference: angularDistance(edge.bearing, targetBearing),
        }))
        .filter(({ difference }) => difference <= ROAD_DIRECTION_TOLERANCE)
        .sort((first, second) => first.difference - second.difference);

      if (candidates.length === 0) {
        addStep('CRASH', statement.line);
        crashed = true;
        break;
      }

      nodeId = candidates[0].edge.to;
      addStep('MOVE', statement.line);
    }

    if (crashed) {
      break;
    }
  }

  return {
    trajectory,
    finalNode: nodeId,
    finalBearing: bearing,
    reachedGoal: !crashed && nodeId === level.goal,
    crashed,
  };
}
