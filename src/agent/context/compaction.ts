import { generateText, type ModelMessage } from 'ai';
import { llm } from '../../llm.ts';
import { extractMessageText } from './tokenEstimator.ts';

const SUMMARIZATION_PROMPT = `You are a conversation summarizer. Your task is to create a concise summary of the conversation so far that preserves:

1. Key decisions and conclusions reached
2. Important context and facts mentioned
3. Any pending tasks or questions
4. The overall goal of the conversation

Be concise but complete. The summary should allow the conversation to continue naturally.

Conversation to summarize:
`;

/**
 * Format messages array as readable text for summarization
 */
function messagesToText(messages: ModelMessage[]): string {
  return messages
    .map(msg => {
      const role = msg.role.toUpperCase();
      const content = extractMessageText(msg);
      return `[${role}]: ${content}`;
    })
    .join('\n\n');
}

/**
 * Compact a conversation by summarizing it with an LLM.
 *
 * Takes the current messages (excluding system prompt) and returns a new
 * messages array with:
 * - A user message containing the summary
 * - An assistant acknowledgment
 *
 * The system prompt should be prepended by the caller.
 */
export async function compactConversation(
  messages: ModelMessage[],
  model: string = 'gpt-5-mini',
): Promise<any> {
  const conversationMessage = messages.filter(m => m.role !== 'system');

  if (conversationMessage.length === 0) {
    return [];
  }

  const conversationText = messagesToText(conversationMessage);

  const { text: summary } = await generateText({
    model: llm.chat(model),
    prompt: SUMMARIZATION_PROMPT + conversationText,
  });

  const compactedMessages: ModelMessage[] = [
    {
      role: 'user',
      content: `[CONVERSATION SUMMARY]\n The following content is a summary of the conversation so far:\n${summary}. Please continue where we left off.`,
    },
    {
      role: 'assistant',
      content: `I understant. I've reviewed the summary of our convo and I'm ready to continue. How can I help? `,
    },
  ];

  return compactedMessages;
}
