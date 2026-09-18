/** Suggested questions shown above the composer (Figma "Quick Prompt" chips). */
export type ChatPromptId = 'explainScan' | 'careGuidance' | 'acneType';

/** Assistant answers are looked up by key so they stay localisable. */
export type ChatReplyKey = ChatPromptId | 'fallback';

export type ChatMessage =
  | { id: string; author: 'user'; text: string }
  | { id: string; author: 'assistant'; replyKey: ChatReplyKey }
  | { id: string; author: 'assistant'; intro: true };
