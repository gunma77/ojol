import {
  COMMAND_NAMES,
  EngineError,
  type CallExpression,
  type CommandName,
  type Program,
  type Token,
  type Statement,
  type IfStatement,
  type RepeatStatement,
  type WhileStatement,
  type Condition,
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

  const current = () => tokens[index];
  const advance = () => tokens[index++];
  const peek = () => tokens[index + 1];

  const expectPunctuation = (value: string, code: 'E03' | 'E04', message: string) => {
    const token = current();
    if (token.type !== 'PUNCTUATION' || token.value !== value) {
      throw new EngineError(code, token.line, message);
    }
    return advance();
  };

  const skipNewlines = () => {
    while (current().type === 'NEWLINE') {
      advance();
    }
  };

  const parseCallExpression = (): CallExpression => {
    const nameToken = advance();
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

    return { type: 'CallExpression', name, arguments: args, line: nameToken.line };
  };

  const parseCondition = (): Condition => {
    const token = current();
    if (token.type !== 'CONDITION') {
      throw new EngineError(
        'E03',
        token.line,
        `Baris ${token.line}: kondisi tidak valid. Gunakan 'adaJalanDiDepan', dsb.`,
      );
    }
    advance();
    return token.value as Condition;
  };

  const parseBlock = (): Statement[] => {
    const braceToken = current();
    if (braceToken.type !== 'LBRACE') {
      throw new EngineError(
        'E03',
        braceToken.line,
        `Baris ${braceToken.line}: perlu tanda '{' untuk memulai blok.`,
      );
    }
    advance();
    skipNewlines();

    const body: Statement[] = [];
    while (current().type !== 'RBRACE' && current().type !== 'EOF') {
      body.push(parseStatement());
      skipNewlines();
    }

    if (current().type !== 'RBRACE') {
      throw new EngineError(
        'E04',
        braceToken.line,
        `Baris ${braceToken.line}: tanda '{' belum ditutup dengan '}'.`,
      );
    }
    advance(); // Consume RBRACE
    return body;
  };

  const parseIfStatement = (): IfStatement => {
    const token = advance(); // 'jika'
    expectPunctuation('(', 'E03', `Baris ${token.line}: setelah 'jika' perlu tanda '('.`);
    const condition = parseCondition();
    expectPunctuation(')', 'E04', `Baris ${token.line}: tanda ')' belum ditutup.`);

    skipNewlines();
    const consequent = parseBlock();
    let alternate: Statement[] | undefined = undefined;

    skipNewlines();
    if (current().type === 'KEYWORD' && current().value === 'jikaTidak') {
      advance(); // Consume 'jikaTidak'
      skipNewlines();
      alternate = parseBlock();
    }

    return { type: 'IfStatement', condition, consequent, alternate, line: token.line };
  };

  const parseRepeatStatement = (): RepeatStatement => {
    const token = advance(); // 'ulang'
    expectPunctuation('(', 'E03', `Baris ${token.line}: setelah 'ulang' perlu tanda '('.`);

    const argToken = current();
    if (argToken.type !== 'NUMBER') {
      throw new EngineError('E06', argToken.line, `Baris ${token.line}: isi 'ulang()' dengan angka.`);
    }
    const count = Number(advance().value);

    expectPunctuation(')', 'E04', `Baris ${token.line}: tanda ')' belum ditutup.`);

    skipNewlines();
    const body = parseBlock();

    return { type: 'RepeatStatement', count, body, line: token.line };
  };

  const parseWhileStatement = (): WhileStatement => {
    const token = advance(); // 'selama'
    expectPunctuation('(', 'E03', `Baris ${token.line}: setelah 'selama' perlu tanda '('.`);
    const condition = parseCondition();
    expectPunctuation(')', 'E04', `Baris ${token.line}: tanda ')' belum ditutup.`);

    skipNewlines();
    const body = parseBlock();

    return { type: 'WhileStatement', condition, body, line: token.line };
  };

  const parseStatement = (): Statement => {
    const token = current();
    let stmt: Statement;

    if (token.type === 'KEYWORD') {
      if (token.value === 'jika') {
        stmt = parseIfStatement();
      } else if (token.value === 'ulang') {
        stmt = parseRepeatStatement();
      } else if (token.value === 'selama') {
        stmt = parseWhileStatement();
      } else {
        throw new EngineError('E03', token.line, `Baris ${token.line}: kata '${token.value}' tidak dikenali di sini.`);
      }
    } else if (token.type === 'IDENTIFIER') {
      stmt = parseCallExpression();
    } else {
      throw new EngineError('E03', token.line, `Baris ${token.line}: perintah tidak dikenali.`);
    }

    // Optional semicolon
    if (current().type === 'PUNCTUATION' && current().value === ';') {
      advance();
    }

    // Must be followed by NEWLINE, EOF, or RBRACE (if inside block)
    if (current().type !== 'NEWLINE' && current().type !== 'EOF' && current().type !== 'RBRACE' && current().type !== 'KEYWORD') {
       // Only allow keyword 'jikaTidak' if it's right after '}' from if? Actually it handles skipNewlines before jikaTidak, but statements themselves need to end.
       if (!(current().type === 'KEYWORD' && current().value === 'jikaTidak')) {
          throw new EngineError(
            'E08',
            token.line,
            `Baris ${token.line}: satu perintah saja untuk setiap baris.`,
          );
       }
    }

    if (current().type === 'NEWLINE') {
      advance();
    }

    return stmt;
  };

  const body: Statement[] = [];
  skipNewlines();
  while (current().type !== 'EOF') {
    body.push(parseStatement());
    skipNewlines();
  }

  return { type: 'Program', body };
}
