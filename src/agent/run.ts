import "dotenv/config";
import { generateText, type ModelMessage } from "ai";
import { google } from "@ai-sdk/google";
import { SYSTEM_PROMPT } from "./system/prompt.ts";

import type { AgentCallbacks } from "../types.ts";

const MODEL_NAME = "gemini-3.7-flash";

export async function runAgent(
  userMessage: string,
  conversationHistory: ModelMessage[],
  callbacks: AgentCallbacks,
): Promise<any> {
  const { text } = await generateText({
    model: google(MODEL_NAME),
    prompt: userMessage,
    system: SYSTEM_PROMPT,
  });

  console.log(text);
}
runAgent("hello my name is ekagra")