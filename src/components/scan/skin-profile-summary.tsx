import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { IconContainer } from '@/components/ui/icon-container';
import { FaceSlightlySmilingIcon } from '@/components/ui/icons';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';
import { useUserData } from '@/providers/app-provider';
import type { Translations } from '@/i18n/en';
import type { SkinProfile } from '@/types/profile';

export function formatSkinProfileShort(profile: SkinProfile | null, t: Translations) {
  if (!profile) return t.profile.skinProfileNotSet;
  return `${t.skinProfileSummary.skinTypeShort[profile.skinType]} · ${t.skinProfileSummary.sensitivity[profile.sensitivity]}`;
}

type SkinProfileSummaryProps = {
  /** Figma uses a taller row with "View" on the result screen. */
  variant?: 'scan' | 'result';
};

/** "Skin Profile · Oily · Sensitive — Edit/View" row. */
export function SkinProfileSummary({ variant = 'scan' }: SkinProfileSummaryProps) {
  const { t } = useI18n();
  const { skinProfile } = useUserData();
  const isResult = variant === 'result';
  const action = isResult ? t.common.view : t.common.edit;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t.common.skinProfile}, ${action}`}
      onPress={() => router.push('/skin-profile')}
      style={({ pressed }) => [styles.bar, isResult && styles.resultBar, pressed && styles.pressed]}>
      <View style={styles.content}>
        <IconContainer size={30} radius={Radius.m}>
          <AppIcon icon={FaceSlightlySmilingIcon} size={16} />
        </IconContainer>
        <View style={styles.copy}>
          <AppText variant={isResult ? 'caption' : 'captionSemibold'} weight="semibold" numberOfLines={1}>
            {isResult ? t.result.skinProfileUsed : t.common.skinProfile}
          </AppText>
          <AppText variant="caption" color={Colors.text.muted} numberOfLines={1}>
            {formatSkinProfileShort(skinProfile, t)}
          </AppText>
        </View>
      </View>
      <AppText
        variant={isResult ? 'caption' : 'caption'}
        weight="semibold"
        color={Colors.brand.primary}
        style={styles.action}>
        {action}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.m,
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.s,
    borderRadius: Radius.l,
    backgroundColor: Colors.surface.notice,
  },
  resultBar: {
    minHeight: 60,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
  },
  copy: {
    flex: 1,
  },
  action: {
    flexShrink: 0,
  },
  pressed: {
    opacity: 0.8,
  },
});
