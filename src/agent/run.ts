import "dotenv/config";
import { generateText, type ModelMessage } from "ai";
import { tools } from "./tools/index.ts";
import { Laminar, getTracer } from "@lmnr-ai/lmnr";
import { executeTools } from "./executeTools.ts";
import { google } from "@ai-sdk/google";
import { SYSTEM_PROMPT } from "./system/prompt.ts";

import type { AgentCallbacks } from "../types.ts";

const MODEL_NAME = "gemini-3.7-flash";

Laminar.initialize({ projectApiKey: process.env.LMNR_PROJECT_API_KEY })

export async function runAgent(
  userMessage: string,
  conversationHistory: ModelMessage[],
  callbacks: AgentCallbacks,
): Promise<any> {
  const { text } = await generateText({
    model: google(MODEL_NAME),
    prompt: userMessage,
    system: SYSTEM_PROMPT,
    tools,
    experimental_telemetry : {
      isEnabled: true,
      tracer : getTracer()
    }
  });


  console.log("done");

}
runAgent("what is the current time")