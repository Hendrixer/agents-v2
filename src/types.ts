export interface AgentCallbacks {
  onToken: (token: string) => void;
  onToolCallStart: (name: string, args: unknown) => void;
  onToolCallEnd: (name: string, result: string) => void;
  onComplete: (response: string) => void;
  onToolApproval: (name: string, args: unknown) => Promise<boolean>;
  onTokenUsage?: (usage: TokenUsageInfo) => void;
}

export interface ToolApprovalRequest {
  toolName: string;
  args: unknown;
  resolve: (approved: boolean) => void;
}

export interface ToolCallInfo {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
}

export interface ModelLimits {
  inputLimit: number;
  outputLimit: number;
  contextWindow: number;
}

export interface TokenUsageInfo {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  contextWindow: number;
  threshold: number;
  percentage: number;
}

/**
 * Tool result output format compatible with Vercel AI SDK.
 * Uses JSONValue type for stricter type compatibility.
 */
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JSONValue }
  | JSONValue[];

export type ToolResultOutput =
  | { type: 'text'; value: string }
  | { type: 'json'; value: JSONValue }
  | { type: 'error-text'; value: string }
  | { type: 'error-json'; value: JSONValue }
  | { type: 'execution-denied'; reason?: string }
  | {
      type: 'content';
      value: Array<
        | { type: 'text'; text: string }
        | { type: 'image-data'; data: string; mediaType: string }
        | { type: 'file-data'; data: string; mediaType: string; filename?: string }
      >;
    };
