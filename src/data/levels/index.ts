import { COMMAND_NAMES, type CommandName, type LevelData } from '@/engine/compiler/types';

import levelJson from './lvl_01.json';

function isCommandName(value: string): value is CommandName {
  return COMMAND_NAMES.some((command) => command === value);
}

const allowedCommands = levelJson.allowed_commands.filter(isCommandName);
if (allowedCommands.length !== levelJson.allowed_commands.length) {
  throw new Error('lvl_01.json contains an unsupported command.');
}

const nodes: LevelData['nodes'] = {};
for (const [nodeId, position] of Object.entries(levelJson.nodes)) {
  if (position.length !== 2 || !position.every(Number.isFinite)) {
    throw new Error(`lvl_01.json contains an invalid coordinate for node ${nodeId}.`);
  }
  nodes[nodeId] = [position[0], position[1]];
}

export const level01: LevelData = {
  ...levelJson,
  allowed_commands: allowedCommands,
  nodes,
};
