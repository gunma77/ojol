import {
  EngineError,
  type LevelData,
  type Program,
  type TrajectoryStep,
  type Statement,
  type Condition,
} from './types';

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

  let nodeId = level.start.node;
  let bearing = normalizeBearing(level.start.bearing);
  let crashed = false;
  let statementsExecuted = 0;
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

  const checkCondition = (condition: Condition): boolean => {
    if (condition === 'diTujuan') {
      return nodeId === level.goal;
    }

    let checkBearing = bearing;
    if (condition === 'adaJalanDiKiri') {
      checkBearing = normalizeBearing(bearing - 90);
    } else if (condition === 'adaJalanDiKanan') {
      checkBearing = normalizeBearing(bearing + 90);
    }

    const candidates = level.edges
      .filter((edge) => edge.from === nodeId)
      .map((edge) => ({
        edge,
        difference: angularDistance(edge.bearing, checkBearing),
      }))
      .filter(({ difference }) => difference <= ROAD_DIRECTION_TOLERANCE);

    return candidates.length > 0;
  };

  const executeStatement = (statement: Statement) => {
    if (crashed) return;

    statementsExecuted++;
    if (statementsExecuted > maxStatements) {
      throw new EngineError(
        'E07',
        statement.line,
        `Baris ${statement.line}: program berjalan terlalu lama. Batas perintah terlampaui. Mungkin ada infinite loop?`,
      );
    }

    if (statement.type === 'CallExpression') {
      if (statement.name === 'belokKanan') {
        bearing = normalizeBearing(bearing + TURN_DEGREES);
        addStep('TURN', statement.line);
        return;
      }

      if (statement.name === 'belokKiri') {
        bearing = normalizeBearing(bearing - TURN_DEGREES);
        addStep('TURN', statement.line);
        return;
      }

      if (statement.name === 'putarBalik') {
        bearing = normalizeBearing(bearing + 180);
        addStep('TURN', statement.line);
        return;
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
    } else if (statement.type === 'IfStatement') {
      if (checkCondition(statement.condition)) {
        executeBlock(statement.consequent);
      } else if (statement.alternate) {
        executeBlock(statement.alternate);
      }
    } else if (statement.type === 'RepeatStatement') {
      for (let i = 0; i < statement.count; i++) {
        if (crashed) break;
        executeBlock(statement.body);
      }
    } else if (statement.type === 'WhileStatement') {
      while (checkCondition(statement.condition) && !crashed) {
        statementsExecuted++;
        if (statementsExecuted > maxStatements) {
          throw new EngineError(
            'E07',
            statement.line,
            `Baris ${statement.line}: infinite loop terdeteksi pada 'selama'.`,
          );
        }
        executeBlock(statement.body);
      }
    }
  };

  const executeBlock = (statements: Statement[]) => {
    for (const statement of statements) {
      if (crashed) break;
      executeStatement(statement);
    }
  };

  executeBlock(program.body);

  return {
    trajectory,
    finalNode: nodeId,
    finalBearing: bearing,
    reachedGoal: !crashed && nodeId === level.goal,
    crashed,
  };
}
