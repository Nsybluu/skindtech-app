import { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { AssistantBubble, TypingIndicator, UserBubble } from '@/components/ai-chat/chat-bubble';
import { ChatComposer } from '@/components/ai-chat/chat-composer';
import { QuickPrompts } from '@/components/ai-chat/quick-prompts';
import { SkinContextCard } from '@/components/ai-chat/skin-context-card';
import { AppText } from '@/components/ui/app-text';
import { ScreenBackground } from '@/components/ui/screen-background';
import { Layout, Spacing } from '@/constants/spacing';
import { useDesignInsets } from '@/hooks/use-design-insets';
import { useI18n } from '@/i18n/i18n-provider';
import { chatService } from '@/services/chat.service';
import type { ChatMessage, ChatPromptId, ChatReplyKey } from '@/types/chat';

/**
 * Figma 14 — AI Skin Assistant.
 *
 * Root tab destination, so the header has no back button (the Figma frame was
 * drawn as a pushed screen). Replies are canned mock data.
 */
export default function AiChatScreen() {
  const { t } = useI18n();
  const { top } = useDesignInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'intro', author: 'assistant', intro: true },
  ]);
  const [draft, setDraft] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // The tab bar floats above the composer, so that space is only needed when the
  // keyboard is closed.
  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const scrollToEnd = () => requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

  const appendReply = async (question: string, ask: () => Promise<ChatReplyKey>) => {
    const sentAt = Date.now();
    setMessages((current) => [...current, { id: `user-${sentAt}`, author: 'user', text: question }]);
    setIsReplying(true);
    scrollToEnd();

    const replyKey = await ask();
    setMessages((current) => [
      ...current,
      { id: `assistant-${sentAt}`, author: 'assistant', replyKey },
    ]);
    setIsReplying(false);
    scrollToEnd();
  };

  const onSelectPrompt = (promptId: ChatPromptId) =>
    appendReply(t.aiChat.prompts[promptId], () => chatService.askPrompt(promptId));

  const onSend = () => {
    const question = draft.trim();
    if (!question || isReplying) return;
    setDraft('');
    void appendReply(question, () => chatService.askQuestion(question));
  };

  return (
    <ScreenBackground>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* The top padding follows the status bar (runtime value). */}
        <View className="px-5" style={{ paddingTop: top(40) }}>
          <View className="min-h-11 w-full max-w-content flex-row items-center justify-between gap-3 self-center">
            <AppText variant="screenTitle" accessibilityRole="header" className="flex-1">
              {t.aiChat.title}
            </AppText>
            <View className="h-7 min-w-[46px] items-center justify-center rounded-pill border border-line-brand bg-white/[0.58] px-3">
              <AppText variant="footnoteSemibold" className="text-brand-gradient-start">
                {t.aiChat.badge}
              </AppText>
            </View>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerClassName="grow px-5 pb-4 pt-4"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="w-full max-w-content gap-3 self-center">
            <SkinContextCard />

            {messages.map((message) =>
              message.author === 'user' ? (
                <UserBubble key={message.id} text={message.text} />
              ) : (
                <AssistantBubble
                  key={message.id}
                  text={'intro' in message ? t.aiChat.intro : t.aiChat.replies[message.replyKey]}
                />
              ),
            )}

            {isReplying ? <TypingIndicator label={t.aiChat.title} /> : null}

            <QuickPrompts onSelect={onSelectPrompt} disabled={isReplying} />
          </View>
        </ScrollView>

        <View className="px-5 pb-3">
          <View className="w-full max-w-content self-center rounded-md bg-surface-notice px-4 py-3">
            <AppText variant="footnote" className="text-center text-fg-secondary">
              {t.aiChat.notice}
            </AppText>
          </View>
        </View>

        <ChatComposer
          value={draft}
          onChangeText={setDraft}
          onSend={onSend}
          disabled={isReplying}
          bottomPadding={keyboardVisible ? Spacing.m : Layout.tabBarClearance}
        />
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}
