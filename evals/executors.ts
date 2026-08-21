import z from "zod";
import {generateText , stepCountIS , tool , type ToolSet } from "ai"
import { google } from "@ai-sdk/google";

import type {
  EvalData,
  SingleTurnResult,
  MultiTurnEvalData,
  MultiTurnResult,
} from "./types.ts";
import { buildMessages } from "./utils.ts";
import { googleTools } from "@ai-sdk/google/internal";

const TOOL_DEFINITION: any = {
  readFile: {
    description : {"read the file on the specific destination"},
    parameters : z.object({
      path : z.string().describe("the location of the file ")
    })
  },
  writeFile: {
    description : {"Write  the content of a  file on the specific destination"},
    parameters : z.object({
      path : z.string().describe("the location of the file that you want to write to  "),
      content: z.string().describe("the content that you want to write in the file")
    })
  },
  deleteFile:{
    description : {"Delete the file content on the specific destination"},
    parameters : z.object({
      path : z.string().describe("the location of the file that you want to delete ")
    })
  },
  listFile:{
    description : {"List the all the file in the directory"},
    parameters : z.object({
      path : z.string().describe("the location of the directory that you want to list  ")
    })
  },
  runCommand:{
    description : {"execute the shell command "},
    parameters : z.object({
      command : z.string().describe("the command you want to run")
    })
  }
}

export const SingleTurnExecutor = async (data : EvalData){
  const messages = buildMessages(data);

  const tools : ToolSet = {};
  for(const toolName of data.tools){
    const def = TOOL_DEFINITION[toolName];

    if(def){
      tools[toolName] = tool({
          description : def.description,
          inputSchema : def.parameters
      })
    }
  }

  const { toolCalls } = await generateText({
    model: google(data.config?.model ?? "gemini-3.7-flash"),
    messages,
    tools,
    stopWhen : stepCountIS(1),
    temperature : data.config?.temperature ?? undefined
  })


  const calls = toolCalls.map((tc)=>({
    toolName : tc.toolName,
    args : "args" in tc ? tc.args : {}
  }))

  const toolNames = toolCalls.map( tc=> tc.toolName)

  return{
    toolCalls,
    toolNames,
    selectedAny: toolNames.length > 0 ,
  }
};