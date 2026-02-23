import { tool } from 'ai';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';

export const readFile = tool({
  description:
    'Reads the full content of a file at the given path, always use this to read a file',
  inputSchema: z.object({
    filePath: z
      .string()
      .describe('The relative, absolute path to the file to read'),
  }),
  execute: async ({ filePath }) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (e) {
      return `There was an error reading the file, here is the native error from node.js: ${e}`;
    }
  },
});

export const writeFile = tool({
  description:
    'Write content to a file at a specified give path. Creates the file if it doesc not exist and will overwrite it if it does',
  inputSchema: z.object({
    filePath: z.string().describe('The path of the file to write to'),
    content: z.string().describe('The content to write to the file'),
  }),
  execute: async ({ filePath, content }) => {
    try {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(filePath, content, 'utf-8');
      return `Successfully wrote ${content.length} characters to file at ${filePath}`;
    } catch (e) {
      return `There was an error writing the file, here is the native error from node.js: ${e}`;
    }
  },
});

export const listFiles = tool({
  description:
    'List all the files and directories in the specified directory path.',
  inputSchema: z.object({
    dirPath: z
      .string()
      .describe('The directory path to list the contents of')
      .default('.'),
  }),
  execute: async ({ dirPath }) => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const items = entries.map(entry => {
        const type = entry.isDirectory() ? '[dir]' : '[file]';
        return `${type} ${entry.name}`;
      });
      return items.length > 0
        ? items.join('\n')
        : 'No files or directories found';
    } catch (e) {
      return `There was an error listing the files, here is the native error from node.js: ${e}`;
    }
  },
});

export const deleteFile = tool({
  description: 'Delete a file at a specified path. Use with caution!',
  inputSchema: z.object({
    filePath: z.string().describe('The path of the file to delete'),
  }),
  execute: async ({ filePath }) => {
    try {
      await fs.unlink(filePath);
      return `Successfully deleted file at ${filePath}`;
    } catch (e) {
      return `There was an error deleting the file, here is the native error from node.js: ${e}`;
    }
  },
});
