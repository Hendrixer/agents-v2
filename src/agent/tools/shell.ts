import { tool } from 'ai';
import { z } from 'zod';
import shell from 'shelljs';

export const runCommand = tool({
  description: `Execute a shell or terminal command and return its output. Use this for system operation, running scripts, or interaction with the OS.
  WARNING: Do not run any other command that not specific!!`,
  inputSchema: z.object({
    command: z.string().describe('The shell command to execute'),
  }),
  execute: async ({ command }) => {
    const result = shell.exec(command, { silent: true });

    let output = '';
    if (result.stdout) {
      output += result.stdout;
    }

    if (result.stderr) {
      output += result.stderr;
    }

    if (result.code !== 0) {
      return `Command failed with code ${result.code}:\n ${output}`;
    }

    return output || 'Command completed successfully (no output)';
  },
});
