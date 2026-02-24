<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
```bash
npm run dev          # Watch mode with tsx, auto-reloads on changes
npm run start        # Run the agent CLI once
npm run build        # Compile TypeScript to dist/
npm link             # Install 'agi' CLI globally (for testing)
```

### Evaluations
```bash
npm run eval                  # Run all evals interactively (lmnr CLI)
npm run eval:file-tools       # Test file tool selection
npm run eval:shell-tools      # Test shell tool approval
npm run eval:agent            # Full multi-turn agent evals
```

### Code Quality
```bash
npx biome check .             # Lint and format check
npx biome check --write .     # Auto-fix lint and formatting
```

## Environment

Required `.env` variables:
- `OPENAI_BASE_URL` - LLM API endpoint
- `OPENAI_API_KEY` - LLM API key
- `OPENAI_MODEL` - Model name (e.g., `gpt-4o`, `doubao-1-5-pro-32k-250115`)
- `LMNR_PROJECT_API_KEY` - Laminar tracing key

### Global Installation (`npm link`)

The CLI can be installed globally via `npm link` for use from any directory. This requires special dotenv handling:

**Issue**: Standard `import 'dotenv/config'` loads `.env` from the current working directory, not the package directory.

**Solution**: `src/config/dotenv.ts` uses `import.meta.url` to resolve `.env` from the package root, regardless of where the CLI is executed. `src/cli.ts` calls `loadPackageEnv()` before any other imports.

**Key implication**: `Laminar.initialize()` in `src/agent/run.ts` is called inside `runAgent()` (not at module level) to ensure it runs AFTER dotenv loads.

## Architecture

### Core Agent Loop (`src/agent/run.ts`)
The agent is a tool-calling loop that:
1. Maintains conversation history with context management
2. Initializes Laminar tracing on first call (lazy init for npm link compatibility)
3. Calls `streamText()` from Vercel AI SDK with tools defined
4. Intercepts tool calls to execute manually (not via SDK auto-execute)
5. Waits for user approval via `onToolApproval` callback
6. Executes tools via `executeTool()` and appends results to messages
7. Repeats until `finishReason !== 'tool-calls'`

### Tool System (`src/agent/tools/`)
Each tool exports an object with:
- `description` - What the tool does (shown to LLM)
- `parameters` - Zod schema for arguments
- `execute` - Async function that returns `ToolResultOutput`

Tool result types:
- `text` / `json` - Success output
- `error-text` / `error-json` - Error output
- `content` - Multi-part output (text + images/files)
- `execution-denied` - HITL rejection

### Context Management (`src/agent/context/`)
- `tokenEstimator.ts` - Estimate token count for messages
- `modelLimits.ts` - Context window limits per model
- `compaction.ts` - Summarize old messages to stay under token limits
- `index.ts` - `compactConversation()` and threshold checking

### Evaluation System (`evals/`)
Two evaluation types:

**Single-turn** (`evaluators.ts`): Tests tool selection without execution
- `toolsSelected()` - Golden prompts: expected tools must be called
- `toolsAvoided()` - Negative prompts: forbidden tools must not be called
- `toolSelectionScore()` - F1 score for precision/recall

**Multi-turn** (`executors.ts`): Full agent runs with mocked tools
- Mock tools return fixed values for deterministic testing
- `llmJudge()` - LLM-judged scoring (1-10 scale)
- `toolOrderCorrect()` - Validates tool call sequencing

### UI (`src/ui/`)
Ink-based TUI with:
- Streaming token display
- Tool call start/end logging
- Interactive approval prompts (y/n for each tool)
- Token usage monitoring

## File Structure

```
src/
├── agent/
│   ├── run.ts           # Core agent loop
│   ├── executeTool.ts   # Tool execution dispatcher
│   ├── tools/           # Tool definitions
│   ├── context/         # Token management
│   └── system/          # System prompt, message filtering
├── config/
│   └── dotenv.ts        # Package-root dotenv loader for npm link
├── ui/                  # Ink React components
├── cli.ts               # CLI entry point (production)
├── index.ts             # Entry point (dev with tsx)
├── llm.ts               # LLM client config
├── types.ts             # Shared types
└── debug.ts             # Debug logging

evals/
├── types.ts             # Eval type definitions
├── evaluators.ts        # Scoring functions
├── executors.ts         # Test runners
└── *.eval.ts            # Eval datasets
```

## Course Development Workflow

This repo contains a finished AI agent app. Course content is developed by working **backwards** from the complete app to a starter template.

## Branch Strategy

- `done` - The complete, finished app (current state)
- Each lesson branch contains the **solution for the previous lesson**
- Work backwards: `done` → `09-hitl` → `08-shell-tool` → ... → `01-intro-to-agents` → starter template

## Process for Each Lesson

Starting from the current branch (which has the complete code for that lesson):

1. **Create the "done" branch first** (only once at the start)
   ```bash
   git checkout -b done
   git push -u origin done
   git checkout main
   ```

2. **For each lesson (working backwards from 09 to 01):**

   a. **Identify the code** related to the current lesson topic

   b. **Copy ALL the code** that will be removed into the corresponding notes file in `notes/XX-Lesson-Name.md`
      - Include complete code blocks with file paths
      - Format for easy copy/paste during live coding
      - Add lecture notes and explanations

   c. **Remove the code** from the app

   d. **Verify the app still works** (or gracefully handles the missing feature)

   e. **Commit the changes** with a clear message

   f. **Create and push a new branch** for the lesson:
      ```bash
      git checkout -b XX-lesson-name
      git push -u origin XX-lesson-name
      git checkout main
      ```

3. **Continue backwards** to the next lesson until you reach a starter template

## Notes File Format

Each notes file in `notes/` should contain:

```markdown
# Lesson Title

## Overview
Brief explanation of what this lesson covers

## Key Concepts
- Concept 1
- Concept 2

## Code

### filename.ts
\`\`\`typescript
// Complete code that was removed
// Students can copy/paste this
\`\`\`

### another-file.ts
\`\`\`typescript
// More code
\`\`\`

## Exercises
Any exercises or challenges for students
```

## Lesson Order (backwards)

| Branch | Lesson | Code to Remove |
|--------|--------|----------------|
| `done` | Complete app | - |
| `09-hitl` | HITL | Human-in-the-loop approval system |
| `08-shell-tool` | Shell Tool | Shell/command execution tool |
| `07-web-search-context-management` | Web Search + Context | Web search tool, context/summarization |
| `06-file-system-tools` | File System Tools | File read/write/list tools |
| `05-multi-turn-evals` | Multi-turn Evals | Multi-turn evaluation code |
| `04-the-agent-loop` | The Agent Loop | Core agent loop implementation |
| `03-single-turn-evals` | Single Turn Evals | Single-turn evaluation code |
| `02-tool-calling` | Tool Calling | Tool definitions and calling logic |
| `01-intro-to-agents` | Intro to Agents | Basic agent structure |
| starter | Starter template | What students begin with |
- do not add any other code other than the code I removed to the lesson, use git status to see that code. ADD NOTHING ELSE. you are only to help make lecture notes and add that code to the notes, no other code. do not look in the repo for any other code other than the code I removed