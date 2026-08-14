import  "dotenv/config";
import { generateText, type ModelMessage } from "ai";
import { SYSTEM_PROMPT } from "./system/prompt.ts";
import type { AgentCallbacks } from "../types.ts";
import { google } from "@ai-sdk/google";
import { GoogleGenAI } from '@google/genai';
const MODEL_NAME = google("gemini-2.5-flash");

const client = new GoogleGenAI({});

export async function runAgent(
  userMessage: string,
  conversationHistory: ModelMessage[],
  callbacks: AgentCallbacks,
): Promise<any> {
    // const { text } = await client.({
    //     model: (MODEL_NAME),
    //     prompt: userMessage,
    //     system: SYSTEM_PROMPT,
    // });

    // console.log(`Agent response: ${text}`);
    let interaction = await client.interactions.create({
        model: 'gemini-3.6-flash',
        input: 'tell me a fact'
    });

    console.log(interaction.output_text);
}


 runAgent('hello my name is ekagra')