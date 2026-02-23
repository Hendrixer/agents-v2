import { evaluate } from '@lmnr-ai/lmnr';
import {
  toolsSelected,
  toolsAvoided,
  toolSelectionScore,
} from './evaluators.ts';
import type { EvalData, EvalTarget } from './types.ts';
import dataset from './data/shell-tools.json' with { type: 'json' };
import { singleTurnWithMocks } from './executors.ts';

/**
 * Shell Tools Selection Evaluation
 *
 * Tests whether the LLM correctly selects the shell command tool
 * (runCommand) based on user prompts.
 *
 * Categories:
 * - golden: Must select runCommand for explicit shell requests
 * - secondary: Likely selects runCommand, scored on precision/recall
 * - negative: Must NOT use shell for non-shell tasks
 */

// Executor that runs single-turn tool selection with mocked tools
const executor = async (data: EvalData) => {
  return singleTurnWithMocks(data);
};

// Run the evaluation
evaluate({
  data: dataset as Array<{ data: EvalData; target: EvalTarget }>,
  executor,
  evaluators: {
    // For golden prompts: did it select runCommand?
    toolsSelected: (output, target) => {
      if (target?.category !== 'golden') return 1;
      return toolsSelected(output, target);
    },
    // For negative prompts: did it avoid runCommand?
    toolsAvoided: (output, target) => {
      if (target?.category !== 'negative') return 1;
      return toolsAvoided(output, target);
    },
    // For secondary prompts: precision/recall score
    selectionScore: (output, target) => {
      if (target?.category !== 'secondary') return 1;
      return toolSelectionScore(output, target);
    },
  },
  config: {
    projectApiKey: process.env.LMNR_PROJECT_API_KEY,
  },
  groupName: 'shell-tools-selection',
});
