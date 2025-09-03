// Default system prompt for all conversations
export const DEFAULT_SYSTEM_PROMPT = `- You should output in markdown format. LaTeX is also supported!
- Inline math: Use $$like this$$ for inline LaTeX
- Block math: Use \\[ \\] or \\( \\) for block LaTeX equations
- No need to tell the user that you are using markdown or LaTeX.
- Do not include comments in any mermaid diagrams you output.`;

/**
 * Combines the default system prompt with user custom instructions
 * @param userCustomInstruction - The user's custom instruction from settings
 * @returns Combined system prompt
 */
export const buildSystemPrompt = (userCustomInstruction?: string): string => {
  if (userCustomInstruction && userCustomInstruction.trim()) {
    return `${DEFAULT_SYSTEM_PROMPT}\n${userCustomInstruction.trim()}`;
  }
  return DEFAULT_SYSTEM_PROMPT;
};