import { MOCK_REPLY_DELAY_MS, REPLY_KEYWORDS } from '@/mocks/chat';
import type { ChatPromptId, ChatReplyKey } from '@/types/chat';

import { mockResponse } from './api';

// TODO(api): POST /assistant/messages via Express (skin profile + latest scan as context).
export const chatService = {
  /** Answers a tapped suggestion. */
  askPrompt(promptId: ChatPromptId): Promise<ChatReplyKey> {
    return mockResponse<ChatReplyKey>(promptId, MOCK_REPLY_DELAY_MS);
  },

  /** Answers free text by matching a few keywords, otherwise falls back. */
  askQuestion(question: string): Promise<ChatReplyKey> {
    const normalised = question.toLowerCase();
    const match = (Object.keys(REPLY_KEYWORDS) as (keyof typeof REPLY_KEYWORDS)[]).find((key) =>
      REPLY_KEYWORDS[key].some((keyword) => normalised.includes(keyword)),
    );

    return mockResponse<ChatReplyKey>(match ?? 'fallback', MOCK_REPLY_DELAY_MS);
  },
};
