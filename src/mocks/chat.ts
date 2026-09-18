import type { ChatPromptId, ChatReplyKey } from '@/types/chat';

/**
 * UI demo data only. The assistant does not call a model — replies are canned
 * and looked up from the translations by key.
 */

export const QUICK_PROMPTS: ChatPromptId[] = ['explainScan', 'careGuidance', 'acneType'];

/** How long the typing bubble is shown before the mock reply arrives. */
export const MOCK_REPLY_DELAY_MS = 900;

/**
 * Keywords that route a freely typed question to one of the canned answers,
 * so the mockup still feels responsive when someone types instead of tapping.
 */
export const REPLY_KEYWORDS: Record<Exclude<ChatReplyKey, 'fallback'>, string[]> = {
  explainScan: ['scan', 'result', 'severity', 'สแกน', 'ผล', 'รุนแรง'],
  careGuidance: ['care', 'routine', 'cleanser', 'moisturizer', 'ดูแล', 'บำรุง', 'ครีม'],
  acneType: ['papule', 'pustule', 'comedone', 'comedonal', 'type', 'สิว', 'สิวอุดตัน', 'ชนิด'],
};
