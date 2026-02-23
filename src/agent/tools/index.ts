import { getDateTime } from './dateTime.ts';
import { readFile, writeFile, listFiles, deleteFile } from './file.ts';
import { webSearch } from './webSearch.ts';
import { runCommand } from './shell.ts';

// All tools combined for the agent
export const tools = {
  getDateTime,
  readFile,
  writeFile,
  listFiles,
  deleteFile,
  webSearch,
  runCommand,
};
