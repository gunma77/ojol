import { EngineError, type Token } from './types';

const punctuation = new Set(['(', ')', ';']);

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  let line = 1;

  while (index < source.length) {
    const character = source[index];

    if (character === '\n') {
      tokens.push({ type: 'NEWLINE', value: '\n', line });
      index += 1;
      line += 1;
      continue;
    }

    if (character === '\r' || character === '\t' || character === ' ') {
      index += 1;
      continue;
    }

    if (character === '#') {
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      continue;
    }

    if (/[A-Za-z_]/.test(character)) {
      const start = index;
      while (index < source.length && /[A-Za-z0-9_]/.test(source[index])) {
        index += 1;
      }
      tokens.push({
        type: 'IDENTIFIER',
        value: source.slice(start, index),
        line,
      });
      continue;
    }

    if (/[0-9]/.test(character)) {
      const start = index;
      while (index < source.length && /[0-9]/.test(source[index])) {
        index += 1;
      }
      tokens.push({
        type: 'NUMBER',
        value: source.slice(start, index),
        line,
      });
      continue;
    }

    if (punctuation.has(character)) {
      tokens.push({ type: 'PUNCTUATION', value: character, line });
      index += 1;
      continue;
    }

    throw new EngineError('E01', line, `Baris ${line}: karakter '${character}' tidak dikenali.`);
  }

  tokens.push({ type: 'EOF', value: '', line });
  return tokens;
}
