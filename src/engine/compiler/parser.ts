import {
  COMMAND_NAMES,
  EngineError,
  type CallExpression,
  type CommandName,
  type Program,
  type Token,
} from './types';

const commandsWithArgument = new Set<CommandName>(['maju', 'mundur']);

function isCommandName(value: string): value is CommandName {
  return COMMAND_NAMES.some((command) => command === value);
}

export function parse(
  tokens: Token[],
  allowedCommands: CommandName[] = [...COMMAND_NAMES],
): Program {
  let index = 0;
  const body: CallExpression[] = [];

  const current = () => tokens[index];
  const advance = () => tokens[index++];
  const expectPunctuation = (value: string, code: 'E03' | 'E04', message: string) => {
    const token = current();
    if (token.type !== 'PUNCTUATION' || token.value !== value) {
      throw new EngineError(code, token.line, message);
    }
    return advance();
  };

  while (current().type !== 'EOF') {
    if (current().type === 'NEWLINE') {
      advance();
      continue;
    }

    const nameToken = current();
    if (nameToken.type !== 'IDENTIFIER') {
      throw new EngineError(
        'E03',
        nameToken.line,
        `Baris ${nameToken.line}: tulis nama perintah, misalnya maju(3).`,
      );
    }
    advance();

    if (!isCommandName(nameToken.value)) {
      const caseHint =
        nameToken.value.toLowerCase() !== nameToken.value
          ? ' Nama perintah membedakan huruf besar dan kecil.'
          : '';
      throw new EngineError(
        'E02',
        nameToken.line,
        `Baris ${nameToken.line}: perintah '${nameToken.value}' belum tersedia.${caseHint}`,
      );
    }

    const name = nameToken.value;
    if (!allowedCommands.includes(name)) {
      throw new EngineError(
        'E02',
        nameToken.line,
        `Baris ${nameToken.line}: perintah '${name}' belum tersedia di level ini.`,
      );
    }

    expectPunctuation(
      '(',
      'E03',
      `Baris ${nameToken.line}: setelah '${name}' perlu tanda '('.`,
    );

    const args: number[] = [];
    if (commandsWithArgument.has(name)) {
      const argument = current();
      if (argument.type !== 'NUMBER') {
        throw new EngineError(
          'E06',
          argument.line,
          `Baris ${nameToken.line}: isi '${name}( )' dengan angka bulat 1–99.`,
        );
      }
      const value = Number(advance().value);
      if (value < 1 || value > 99) {
        throw new EngineError(
          'E06',
          argument.line,
          `Baris ${nameToken.line}: angka pada '${name}' harus antara 1 dan 99.`,
        );
      }
      args.push(value);
    } else if (current().type === 'NUMBER') {
      throw new EngineError(
        'E06',
        current().line,
        `Baris ${nameToken.line}: perintah '${name}' tidak memakai angka.`,
      );
    }

    expectPunctuation(
      ')',
      'E04',
      `Baris ${nameToken.line}: tanda ')' belum ditutup.`,
    );

    if (current().type === 'PUNCTUATION' && current().value === ';') {
      advance();
    }

    if (current().type !== 'NEWLINE' && current().type !== 'EOF') {
      throw new EngineError(
        'E08',
        current().line,
        `Baris ${nameToken.line}: satu perintah saja untuk setiap baris.`,
      );
    }

    body.push({ type: 'CallExpression', name, arguments: args, line: nameToken.line });
    if (current().type === 'NEWLINE') {
      advance();
    }
  }

  return { type: 'Program', body };
}
