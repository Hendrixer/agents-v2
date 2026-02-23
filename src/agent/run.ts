import { streamText, type ModelMessage } from 'ai';
import { getTracer } from '@lmnr-ai/lmnr';
import { tools } from './tools/index.ts';
import { executeTool } from './executeTool.ts';
import { SYSTEM_PROMPT } from './system/prompt.ts';
import { Laminar } from '@lmnr-ai/lmnr';
import type { AgentCallbacks, ToolCallInfo } from '../types.ts';
import { llm } from '../llm.ts';
import { logLLMMessages } from '../debug.ts';

import {
  calculateUsagePercentage,
  compactConversation,
  DEFAULT_THRESHOLD,
  estimateMessagesTokens,
  getModelLimits,
  isOverThreshold,
} from './context/index.ts';

import { filterCompatibleMessages } from './system/filterMessages.ts';

Laminar.initialize({
  projectApiKey: process.env.LMNR_PROJECT_API_KEY,
});

// 去掉 execute 后再传给 streamText，避免 SDK 自动执行工具。
const modelTools = Object.fromEntries(
  Object.entries(tools).map(([name, toolDef]) => {
    const { execute: _execute, ...toolWithoutExecute } = toolDef as any;
    return [name, toolWithoutExecute];
  }),
) as typeof tools;

export async function runAgent(
  userMessage: string,
  conversationHistory: ModelMessage[],
  callbacks: AgentCallbacks,
): Promise<ModelMessage[]> {
  const modelName = process.env.OPENAI_MODEL!;
  const modelLimits = getModelLimits(modelName);
  // Filter and check if we need to compact the conversation history before starting
  const workingHistory = filterCompatibleMessages(conversationHistory);

  let messages: ModelMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...workingHistory,
    { role: 'user', content: userMessage },
  ];

  const precheckTokens = estimateMessagesTokens(messages);
  if (isOverThreshold(precheckTokens.total, modelLimits.contextWindow)) {
    messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(await compactConversation(workingHistory, modelName)),
      { role: 'user', content: userMessage },
    ];
  }

  let fullResponse = '';

  while (true) {
    logLLMMessages('messages -> model', messages);
    const result = streamText({
      model: llm.chat(modelName),
      messages,
      tools: modelTools,
      experimental_telemetry: {
        isEnabled: true,
        tracer: getTracer(),
      },
    });

    const reportTokenUsage = () => {
      if (callbacks.onTokenUsage) {
        const usage = estimateMessagesTokens(messages);
        callbacks.onTokenUsage({
          inputTokens: usage.input,
          outputTokens: usage.output,
          totalTokens: usage.total,
          contextWindow: modelLimits.contextWindow,
          threshold: DEFAULT_THRESHOLD,
          percentage: calculateUsagePercentage(
            usage.total,
            modelLimits.contextWindow,
          ),
        });
      }
    };

    const toolCalls: ToolCallInfo[] = [];
    let currentText = '';
    let streamError: Error | null = null;

    try {
      for await (const chunk of result.fullStream) {
        if (chunk.type === 'text-delta') {
          currentText += chunk.text;
          callbacks.onToken(chunk.text);
        }

        if (chunk.type === 'tool-call') {
          const input = 'input' in chunk ? chunk.input : {};
          toolCalls.push({
            toolCallId: chunk.toolCallId,
            toolName: chunk.toolName,
            args: input as Record<string, unknown>,
          });
          callbacks.onToolCallStart(chunk.toolName, input);
        }
      }
    } catch (error) {
      streamError = error as Error;
      // If we have some text, continue processing
      // Otherwise, rethrow if it's not a "no output" error
      if (
        !currentText &&
        !streamError.message.includes('No output generated')
      ) {
        throw streamError;
      }
    }

    fullResponse += currentText;

    // If stream errored with "no output" and we have no text, try to recover
    if (streamError && !currentText) {
      // Add a fallback response
      fullResponse =
        "I apologize, but I wasn't able to generate a response. Could you please try rephrasing your message?";
      callbacks.onToken(fullResponse);
      break;
    }

    const finishReason = await result.finishReason;

    if (finishReason !== 'tool-calls' || toolCalls.length === 0) {
      const responseMessages = await result.response;
      messages.push(...responseMessages.messages);
      reportTokenUsage();
      break;
    }

    const responseMessages = await result.response;
    logLLMMessages('response <- model (tool-calls)', responseMessages.messages);
    messages.push(...responseMessages.messages);

    for (const tc of toolCalls) {
      const result = await executeTool(tc.toolName, tc.args);
      callbacks.onToolCallEnd(tc.toolName, result);

      messages.push({
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: tc.toolCallId,
            toolName: tc.toolName,
            output: { type: 'text', value: result },
          },
        ],
      });

      reportTokenUsage();
    }
  }

  callbacks.onComplete(fullResponse);

  return messages;
}
