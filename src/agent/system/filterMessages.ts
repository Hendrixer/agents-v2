import type { ModelMessage } from 'ai';
/**
 * Filter conversation history to only include compatible message formats.
 * Provider tools (like webSearch) may return messages with formats that
 * cause issues when passed back to subsequent API calls.
 */
export const filterCompatibleMessages = (
  messages: ModelMessage[],
): ModelMessage[] => {
  return messages.filter(msg => {
    // Keep user and system messages
    if (msg.role === 'user') {
      return true;
    }

    if (msg.role === 'system') {
      return false;
    }

    // Keep assistant messages that have text content
    if (msg.role === 'assistant') {
      const content = msg.content;
      if (typeof content === 'string' && content.trim()) {
        return true;
      }
      // Check for array content with text parts
      if (Array.isArray(content)) {
        const hasTextContent = content.some((part: unknown) => {
          if (typeof part === 'string' && part.trim()) return true;
          if (typeof part === 'object' && part !== null && 'text' in part) {
            const textPart = part as { text?: string };
            return textPart.text && textPart.text.trim();
          }
          return false;
        });
        return hasTextContent;
      }
    }

    // Keep tool messages
    if (msg.role === 'tool') {
      return true;
    }

    return false;
  });
};
