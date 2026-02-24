// 通过环境变量控制是否打印 LLM 输入输出消息，避免默认污染终端。
// 动态 import 确保 dotenv 在所有模块导入前加载
const DEBUG_LLM_MESSAGES = process.env.DEBUG_LLM_MESSAGES === 'true';

export const logLLMMessages = (label: string, data: unknown) => {
  if (!DEBUG_LLM_MESSAGES) return;
  console.error(`[LLM DEBUG] ${label}\n${JSON.stringify(data, null, 2)}`);
};
