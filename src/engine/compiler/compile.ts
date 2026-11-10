import { angularDistance, interpret } from './interpreter';
import { tokenize } from './lexer';
import { parse } from './parser';
import {
  EngineError,
  type CompileError,
  type CompileResult,
  type LevelData,
} from './types';

export function countLoc(source: string) {
  return source
    .split(/\r?\n/)
    .filter((line) => line.replace(/#.*$/, '').trim().length > 0).length;
}

function validateLevel(level: LevelData) {
  if (!level.start || !level.nodes[level.start.node] || !level.nodes[level.goal]) {
    throw new EngineError('E10', 0, 'Data level tidak lengkap: titik awal atau tujuan tidak ditemukan.');
  }

  if (!Number.isFinite(level.start.bearing) || level.start.bearing < 0 || level.start.bearing >= 360) {
    throw new EngineError('E10', 0, 'Data level tidak valid: arah awal harus berada pada 0–359°.');
  }

  for (const [nodeId, coordinate] of Object.entries(level.nodes)) {
    if (coordinate.length !== 2 || !coordinate.every(Number.isFinite)) {
      throw new EngineError('E10', 0, `Data level tidak valid: koordinat simpang ${nodeId} tidak lengkap.`);
    }
  }

  for (const edge of level.edges) {
    if (
      !level.nodes[edge.from] ||
      !level.nodes[edge.to] ||
      !Number.isFinite(edge.bearing) ||
      edge.bearing < 0 ||
      edge.bearing >= 360
    ) {
      throw new EngineError('E10', 0, 'Data level tidak valid: ada ruas jalan yang tidak lengkap.');
    }
  }

  const reachableBearings = [0, 90, 180, 270].map((turn) => (level.start.bearing + turn) % 360);
  for (const nodeId of Object.keys(level.nodes)) {
    const outgoingEdges = level.edges.filter((edge) => edge.from === nodeId);
    for (const bearing of reachableBearings) {
      const alignedEdges = outgoingEdges.filter(
        (edge) => angularDistance(edge.bearing, bearing) <= 45,
      );

      if (alignedEdges.length > 1) {
        throw new EngineError(
          'E10',
          0,
          `Data level tidak valid: simpang ${nodeId} memiliki lebih dari satu ruas pada arah yang sama.`,
        );
      }
    }
  }
}

export function compileProgram(source: string, level: LevelData): CompileResult {
  const loc = countLoc(source);

  try {
    if (source.length > 1000) {
      throw new EngineError('E09', 1, 'Skrip terlalu panjang. Batasnya 1000 karakter.');
    }
    if (source.split(/\r?\n/).length > 50) {
      throw new EngineError('E09', 51, 'Baris 51: skrip dibatasi hingga 50 baris.');
    }

    validateLevel(level);
    const program = parse(tokenize(source), level.allowed_commands);
    return { ok: true, loc, ...interpret(program, level) };
  } catch (error) {
    if (error instanceof EngineError) {
      const compileError: CompileError = {
        code: error.code,
        line: error.line,
        message: error.message,
      };
      return { ok: false, loc, error: compileError };
    }

    throw error;
  }
}
