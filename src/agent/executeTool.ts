import { tools } from './tools/index.ts';
import type { ToolResultOutput, JSONValue } from '../types.ts';

export type ToolName = keyof typeof tools;

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
): Promise<ToolResultOutput> {
  const tool = tools[name as ToolName];

  if (!tool) {
    return {
      type: 'error-text',
      value: `Unknown tool: ${name}`,
    };
  }

  const execute = tool.execute;
  if (!execute) {
    // Provider tools (like webSearch) are executed by OpenAI, not us
    return {
      type: 'text',
      value: `Provider tool ${name} - executed by model provider`,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawResult = await execute(args as any, {
    toolCallId: '',
    messages: [],
  });

  // Convert the result to ToolResultOutput format
  if (typeof rawResult === 'string') {
    return { type: 'text', value: rawResult };
  }

  // If already in ToolResultOutput format, return as-is
  if (
    typeof rawResult === 'object' &&
    rawResult !== null &&
    'type' in rawResult &&
    typeof rawResult.type === 'string'
  ) {
    return rawResult as ToolResultOutput;
  }

  // Otherwise, wrap as JSON with type assertion
  return {
    type: 'json',
    value: rawResult as JSONValue,
  };
}
