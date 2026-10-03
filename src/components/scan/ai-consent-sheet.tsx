import { Pressable, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { IconContainer } from '@/components/ui/icon-container';
import { ShieldCheckIcon } from '@/components/ui/icons';
import { Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';

type AiConsentSheetProps = {
  visible: boolean;
  onClose: () => void;
  onDecline: () => void;
  onAllow: () => void;
  onLearnMore: () => void;
  /** A choice is being saved: lock the buttons and keep the sheet open until it is confirmed. */
  busy?: boolean;
};

/** Figma 07A.1 — "Modal / AI Improvement Consent". */
export function AiConsentSheet({
  visible,
  onClose,
  onDecline,
  onAllow,
  onLearnMore,
  busy = false,
}: AiConsentSheetProps) {
  const { t } = useI18n();

  return (
    <BottomSheet
      visible={visible}
      onClose={busy ? () => {} : onClose}
      bottomPadding={Spacing.l}
      className="bg-[rgba(255,253,252,0.99)]">
      <View className="flex-row items-start gap-3 py-1">
        <IconContainer className="size-10 rounded-full">
          <AppIcon icon={ShieldCheckIcon} size={20} />
        </IconContainer>
        <View className="flex-1 gap-1">
          <AppText variant="headline" accessibilityRole="header">
            {t.consent.title}
          </AppText>
          <AppText variant="body" className="text-fg-secondary">
            {t.consent.body}
          </AppText>
        </View>
      </View>

      <View className="gap-2 rounded-lg bg-[rgba(253,235,235,0.58)] p-3">
        {[t.consent.benefitUsage, t.consent.benefitOptional].map((benefit) => (
          <View key={benefit} className="flex-row items-center gap-3">
            <View className="size-[7px] rounded-full bg-brand-primary" />
            <AppText variant="bodySmall" className="flex-1 text-fg-secondary">
              {benefit}
            </AppText>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="link"
        onPress={onLearnMore}
        disabled={busy}
        hitSlop={6}
        className="active:opacity-60">
        <AppText variant="label" className="text-center text-brand-primary">
          {t.consent.learnMore}
        </AppText>
      </Pressable>

      <AppText variant="footnote" className="text-center text-fg-muted">
        {t.consent.finePrint}
      </AppText>

      <View className="flex-row gap-3">
        <AppButton
          variant="secondary"
          label={t.consent.notNow}
          onPress={onDecline}
          disabled={busy}
          className="w-[104px] border-rose/[0.32] bg-white/[0.75]"
        />
        <AppButton
          variant="solid"
          label={busy ? t.consent.saving : t.consent.allow}
          onPress={onAllow}
          disabled={busy}
          className="flex-1"
        />
      </View>
    </BottomSheet>
  );
}
