import { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AssistantBubble, TypingIndicator, UserBubble } from '@/components/ai-chat/chat-bubble';
import { ChatComposer } from '@/components/ai-chat/chat-composer';
import { QuickPrompts } from '@/components/ai-chat/quick-prompts';
import { SkinContextCard } from '@/components/ai-chat/skin-context-card';
import { AppText } from '@/components/ui/app-text';
import { ScreenBackground } from '@/components/ui/screen-background';
import { Alpha, Colors } from '@/constants/colors';
import { Layout, Radius, Spacing } from '@/constants/spacing';
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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { paddingTop: top(40) }]}>
          <View style={styles.headerRow}>
            <AppText variant="screenTitle" accessibilityRole="header" style={styles.headerTitle}>
              {t.aiChat.title}
            </AppText>
            <View style={styles.badge}>
              <AppText variant="footnoteSemibold" color={Colors.brand.gradientStart}>
                {t.aiChat.badge}
              </AppText>
            </View>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.constrained}>
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

        <View style={styles.noticeWrapper}>
          <View style={styles.notice}>
            <AppText variant="footnote" color={Colors.text.secondary} align="center">
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

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Layout.screenPadding,
  },
  headerRow: {
    minHeight: Layout.headerHeight,
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.m,
  },
  headerTitle: {
    flex: 1,
  },
  badge: {
    minWidth: 46,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.m,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border.brand,
    backgroundColor: Alpha.white(0.58),
  },
  content: {
    flexGrow: 1,
    paddingTop: Spacing.l,
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.l,
  },
  constrained: {
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
    gap: Spacing.m,
  },
  noticeWrapper: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.m,
  },
  notice: {
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
    borderRadius: Radius.m,
    backgroundColor: Colors.surface.notice,
  },
});
