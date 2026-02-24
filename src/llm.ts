import { createOpenAI } from '@ai-sdk/openai';

// 动态 import 确保 dotenv 在所有模块导入前加载
export const llm = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});
