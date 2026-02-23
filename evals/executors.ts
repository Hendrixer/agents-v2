import {
  generateText,
  Output,
  stepCountIs,
  tool,
  type ModelMessage,
  type ToolSet,
} from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

import type {
  EvalData,
  SingleTurnResult,
  MultiTurnEvalData,
  MultiTurnResult,
} from './types.ts';
import { buildMessages, buildMockedTools } from './utils.ts';
import { SYSTEM_PROMPT } from '../src/agent/system/prompt.ts';
import { llm } from '../src/llm.ts';

// 通过环境变量控制是否打印 LLM 输入输出消息，避免默认污染终端。
const DEBUG_LLM_MESSAGES = process.env.DEBUG_LLM_MESSAGES === 'true';

const logLLMMessages = (label: string, data: unknown) => {
  if (!DEBUG_LLM_MESSAGES) return;
  console.error(`[LLM DEBUG] ${label}\n${JSON.stringify(data, null, 2)}`);
};

const getToolCallArgs = (toolCall: unknown) => {
  if (toolCall && typeof toolCall === 'object') {
    if ('input' in toolCall) return (toolCall as { input: unknown }).input;
    if ('args' in toolCall) return (toolCall as { args: unknown }).args;
  }
  return {};
};

/**
 * Tool definitions for mocked single-turn evaluations.
 * These define the schema the LLM sees without real implementations.
 */
const TOOL_DEFINITIONS: Record<
  string,
  { description: string; parameters: z.ZodObject<z.ZodRawShape> }
> = {
  // File tools
  readFile: {
    description: 'Read the contents of a file at the specified path',
    parameters: z.object({
      path: z.string().describe('The path to the file to read'),
    }),
  },
  writeFile: {
    description: 'Write content to a file at the specified path',
    parameters: z.object({
      path: z.string().describe('The path to the file to write'),
      content: z.string().describe('The content to write to the file'),
    }),
  },
  listFiles: {
    description: 'List all files in a directory',
    parameters: z.object({
      path: z.string().describe('The directory path to list files from'),
    }),
  },
  deleteFile: {
    description: 'Delete a file at the specified path',
    parameters: z.object({
      path: z.string().describe('The path to the file to delete'),
    }),
  },
  // Shell tools
  runCommand: {
    description: 'Execute a shell command and return its output',
    parameters: z.object({
      command: z.string().describe('The shell command to execute'),
    }),
  },
};

/**
 * Single-turn executor with mocked tools.
 * Uses predefined tool definitions - tools never execute, only selection is tested.
 */
export async function singleTurnWithMocks(
  data: EvalData,
): Promise<SingleTurnResult> {
  const messages = buildMessages(data);

  // Build mocked tools from definitions
  const tools: ToolSet = {};
  for (const toolName of data.tools) {
    const def = TOOL_DEFINITIONS[toolName];
    if (def) {
      tools[toolName] = tool({
        description: def.description,
        inputSchema: def.parameters,
      });
    }
  }

  const result = await generateText({
    model: llm.chat(process.env.OPENAI_MODEL!),
    messages,
    tools,
    stopWhen: stepCountIs(1),
    temperature: data.config?.temperature ?? undefined,
  });

  // Extract tool calls from the result
  const toolCalls = (result.toolCalls ?? []).map(tc => ({
    toolName: tc.toolName,
    args: getToolCallArgs(tc),
  }));

  const toolNames = toolCalls.map(tc => tc.toolName);

  return {
    toolCalls,
    toolNames,
    selectedAny: toolNames.length > 0,
  };
}

/**
 * Multi-turn executor with mocked tools.
 * Runs a complete agent loop with tools returning fixed values.
 */

export const multiTurnWithMocks = async (
  data: MultiTurnEvalData,
): Promise<MultiTurnResult> => {
  const tools = buildMockedTools(data.mockTools);

  const messages: ModelMessage[] = data.messages ?? [
    {
      role: 'system',
      content: SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: data.prompt!,
    },
  ];

  logLLMMessages('messages -> model', messages);
  const result = await generateText({
    model: llm.chat(process.env.OPENAI_MODEL!),
    messages,
    tools,
    stopWhen: stepCountIs(data.config?.maxSteps ?? 20),
  });

  logLLMMessages('response <- model', {
    steps: result.steps,
  });

  const allToolCalls: string[] = [];
  const steps = result.steps.map(step => {
    const stepToolCalls = (step.toolCalls ?? []).map(tc => {
      allToolCalls.push(tc.toolName);
      return {
        toolName: tc.toolName,
        args: getToolCallArgs(tc),
      };
    });

    const stepToolResults = (step.toolResults ?? []).map(tr => ({
      toolName: tr.toolName,
      result: tr.output,
    }));

    return {
      toolCalls: stepToolCalls.length > 0 ? stepToolCalls : undefined,
      toolResults: stepToolResults.length > 0 ? stepToolResults : undefined,
      text: step.text || undefined,
    };
  });

  const toolsUsed = [...new Set(allToolCalls)];

  return {
    text: result.text,
    steps,
    toolsUsed,
    toolCallOrder: allToolCalls,
  };
};
