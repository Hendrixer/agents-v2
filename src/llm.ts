import { createOpenAI } from '@ai-sdk/openai';

export const llm = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});
