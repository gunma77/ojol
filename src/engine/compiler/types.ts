export const COMMAND_NAMES = [
  'maju',
  'mundur',
  'belokKanan',
  'belokKiri',
  'putarBalik',
] as const;

export type CommandName = (typeof COMMAND_NAMES)[number];

export const KEYWORDS = ['jika', 'jikaTidak', 'ulang', 'selama'] as const;
export type Keyword = (typeof KEYWORDS)[number];

export const CONDITIONS = [
  'adaJalanDiDepan',
  'adaJalanDiKiri',
  'adaJalanDiKanan',
  'diTujuan',
] as const;
export type Condition = (typeof CONDITIONS)[number];

export type TokenType =
  | 'IDENTIFIER'
  | 'NUMBER'
  | 'PUNCTUATION'
  | 'NEWLINE'
  | 'LBRACE'
  | 'RBRACE'
  | 'KEYWORD'
  | 'CONDITION'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
}

export interface CallExpression {
  type: 'CallExpression';
  name: CommandName;
  arguments: number[];
  line: number;
}

export interface IfStatement {
  type: 'IfStatement';
  condition: Condition;
  consequent: Statement[];
  alternate?: Statement[];
  line: number;
}

export interface RepeatStatement {
  type: 'RepeatStatement';
  count: number;
  body: Statement[];
  line: number;
}

export interface WhileStatement {
  type: 'WhileStatement';
  condition: Condition;
  body: Statement[];
  line: number;
}

export type Statement = CallExpression | IfStatement | RepeatStatement | WhileStatement;

export interface Program {
  type: 'Program';
  body: Statement[];
}

export interface RoadEdge {
  from: string;
  to: string;
  bearing: number;
}

export interface LevelData {
  level_id: string;
  title: string;
  allowed_commands: CommandName[];
  optimal_loc: number;
  star_thresholds?: {
    three: number;
    two: number;
  };
  max_statements?: number;
  start: {
    node: string;
    bearing: number;
  };
  goal: string;
  nodes: Record<string, [number, number]>;
  edges: RoadEdge[];
}

export type TrajectoryAction = 'MOVE' | 'TURN' | 'CRASH';

export interface TrajectoryStep {
  stepIndex: number;
  action: TrajectoryAction;
  coordinate: [number, number];
  bearing: number;
  nodeId: string;
  line: number;
}

export type CompileErrorCode =
  | 'E01'
  | 'E02'
  | 'E03'
  | 'E04'
  | 'E06'
  | 'E07'
  | 'E08'
  | 'E09'
  | 'E10';

export interface CompileError {
  code: CompileErrorCode;
  line: number;
  message: string;
}

export interface RunSummary {
  trajectory: TrajectoryStep[];
  finalNode: string;
  finalBearing: number;
  reachedGoal: boolean;
  crashed: boolean;
}

export type CompileResult =
  | ({ ok: true; loc: number } & RunSummary)
  | { ok: false; loc: number; error: CompileError };

export class EngineError extends Error {
  constructor(
    public readonly code: CompileErrorCode,
    public readonly line: number,
    message: string,
  ) {
    super(message);
    this.name = 'EngineError';
  }
}
