import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { IconContainer } from '@/components/ui/icon-container';
import { ShieldCheckIcon } from '@/components/ui/icons';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';

type AiConsentSheetProps = {
  visible: boolean;
  onClose: () => void;
  onDecline: () => void;
  onAllow: () => void;
  onLearnMore: () => void;
};

/** Figma 07A.1 — "Modal / AI Improvement Consent". */
export function AiConsentSheet({ visible, onClose, onDecline, onAllow, onLearnMore }: AiConsentSheetProps) {
  const { t } = useI18n();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      handleColor="rgba(201, 181, 174, 0.8)"
      bottomPadding={Spacing.l}
      style={styles.sheet}>
      <View style={styles.intro}>
        <IconContainer size={40} radius={20} backgroundColor={Alpha.white(0.7)}>
          <AppIcon icon={ShieldCheckIcon} size={20} />
        </IconContainer>
        <View style={styles.introCopy}>
          <AppText variant="sheetTitle" accessibilityRole="header">
            {t.consent.title}
          </AppText>
          <AppText variant="caption" color={Colors.text.secondary}>
            {t.consent.body}
          </AppText>
        </View>
      </View>

      <View style={styles.benefits}>
        {[t.consent.benefitUsage, t.consent.benefitOptional].map((benefit) => (
          <View key={benefit} style={styles.benefitRow}>
            <View style={styles.bullet} />
            <AppText variant="caption" color={Colors.text.secondary} style={styles.benefitText}>
              {benefit}
            </AppText>
          </View>
        ))}
      </View>

      <Pressable accessibilityRole="link" onPress={onLearnMore} hitSlop={6}>
        {({ pressed }) => (
          <AppText
            variant="caption"
            weight="semibold"
            color={Colors.brand.primary}
            align="center"
            style={pressed && styles.pressed}>
            {t.consent.learnMore}
          </AppText>
        )}
      </Pressable>

      <AppText variant="footnote" color={Colors.text.muted} align="center">
        {t.consent.finePrint}
      </AppText>

      <View style={styles.actions}>
        <AppButton
          variant="secondary"
          label={t.consent.notNow}
          onPress={onDecline}
          textVariant="button"
          style={styles.secondary}
        />
        <AppButton
          variant="solid"
          label={t.consent.allow}
          onPress={onAllow}
          textVariant="button"
          style={styles.primary}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: 'rgba(255, 253, 252, 0.99)',
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    paddingVertical: Spacing.xs,
  },
  introCopy: {
    flex: 1,
    gap: Spacing.xxs,
  },
  benefits: {
    gap: Spacing.s,
    padding: Spacing.m,
    borderRadius: Radius.l,
    backgroundColor: 'rgba(253, 235, 235, 0.58)',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
  },
  bullet: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.brand.primary,
  },
  benefitText: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.m,
  },
  secondary: {
    width: 104,
    borderColor: Alpha.rose(0.32),
    backgroundColor: Alpha.white(0.75),
  },
  primary: {
    flex: 1,
  },
  pressed: {
    opacity: 0.6,
  },
});
