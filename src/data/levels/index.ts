import { COMMAND_NAMES, type CommandName, type LevelData } from '@/engine/compiler/types';

import lvl01 from './lvl_01.json';
import lvl02 from './lvl_02.json';
import lvl03 from './lvl_03.json';
import lvl04 from './lvl_04.json';
import lvl05 from './lvl_05.json';
import lvl06 from './lvl_06.json';

function isCommandName(value: string): value is CommandName {
  return COMMAND_NAMES.some((command) => command === value);
}

function processLevelData(levelJson: any, fileName: string): LevelData {
  const allowedCommands = levelJson.allowed_commands.filter(isCommandName);
  if (allowedCommands.length !== levelJson.allowed_commands.length) {
    throw new Error(`${fileName} contains an unsupported command.`);
  }

  const nodes: LevelData['nodes'] = {};
  for (const [nodeId, position] of Object.entries(levelJson.nodes)) {
    if (!Array.isArray(position) || position.length !== 2 || !position.every(Number.isFinite)) {
      throw new Error(`${fileName} contains an invalid coordinate for node ${nodeId}.`);
    }
    nodes[nodeId] = [position[0], position[1]];
  }

  return {
    ...levelJson,
    allowed_commands: allowedCommands,
    nodes,
  };
}

export const level01 = processLevelData(lvl01, 'lvl_01.json');
export const level02 = processLevelData(lvl02, 'lvl_02.json');
export const level03 = processLevelData(lvl03, 'lvl_03.json');
export const level04 = processLevelData(lvl04, 'lvl_04.json');
export const level05 = processLevelData(lvl05, 'lvl_05.json');
export const level06 = processLevelData(lvl06, 'lvl_06.json');

export const levels: LevelData[] = [level01, level02, level03, level04, level05, level06];
