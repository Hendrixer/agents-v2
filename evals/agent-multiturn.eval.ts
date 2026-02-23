import { evaluate } from '@lmnr-ai/lmnr';
import { toolOrderCorrect, toolsAvoided, llmJudge } from './evaluators.ts';

import type {
  MultiTurnEvalData,
  MultiTurnDatasetEntry,
  MultiTurnResult,
  MultiTurnTarget,
} from './types.ts';

import dataset from './data/agent-multiturn.json' with { type: 'json' };
import { multiTurnWithMocks } from './executors.ts';

const executor = async (data: MultiTurnEvalData) => {
  const result = await multiTurnWithMocks(data);
  return result;
};

evaluate({
  data: dataset as any,
  executor,
  evaluators: {
    outputQuality: async (output: any, target: any) => {
      if (!target) return 1;
      return llmJudge(output, target);
    },
  },
  config: {
    projectApiKey: process.env.LMNR_PROJECT_API_KEY,
  },
  groupName: 'agent-multiturn',
});
