import "dotenv/config";
import { generateText, type ModelMessage } from "ai";
import { tools } from "./tools/index.ts";
import { executeTools } from "./executeTools.ts";
import { google } from "@ai-sdk/google";
import { SYSTEM_PROMPT } from "./system/prompt.ts";

import type { AgentCallbacks } from "../types.ts";

const MODEL_NAME = "gemini-3.7-flash";

export async function runAgent(
  userMessage: string,
  conversationHistory: ModelMessage[],
  callbacks: AgentCallbacks,
): Promise<any> {
  const { text , toolCalls} = await generateText({
    model: google(MODEL_NAME),
    prompt: userMessage,
    system: SYSTEM_PROMPT,
    tools,
  });


  console.log(text , toolCalls);

  toolCalls.forEach(async(tc)=>{
    console.log( await executeTools(tc.toolName , tc.input))
  })
}
runAgent("what is the current time")