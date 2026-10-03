import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { IconContainer } from '@/components/ui/icon-container';
import { FaceSlightlySmilingIcon } from '@/components/ui/icons';
import { useI18n } from '@/i18n/i18n-provider';
import { useUserData } from '@/providers/app-provider';
import type { Translations } from '@/i18n/en';
import type { SkinProfile } from '@/types/profile';

export function formatSkinProfileShort(profile: SkinProfile | null, t: Translations) {
  if (!profile) return t.profile.skinProfileNotSet;
  return `${t.skinProfileSummary.skinTypeShort[profile.skinType]} · ${t.skinProfileSummary.sensitivity[profile.sensitivity]}`;
}

/**
 * "Skin Profile · Oily · Sensitive — Edit" row of the scan flow. It shows the CURRENT profile, which
 * is the one the next scan will use. A finished scan shows its own snapshot instead
 * (see `SkinProfileSnapshotCard`), never this.
 */
export function SkinProfileSummary() {
  const { t } = useI18n();
  const { skinProfile } = useUserData();
  const action = t.common.edit;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t.common.skinProfile}, ${action}`}
      onPress={() => router.push('/skin-profile')}
      className="min-h-14 flex-row items-center justify-between gap-3 rounded-lg bg-surface-notice px-4 py-2 active:opacity-80">
      <View className="flex-1 flex-row items-center gap-3">
        <IconContainer className="size-[30px] rounded-md">
          <AppIcon icon={FaceSlightlySmilingIcon} size={16} />
        </IconContainer>
        <View className="flex-1">
          <AppText variant="captionSemibold" numberOfLines={1}>
            {t.common.skinProfile}
          </AppText>
          <AppText variant="caption" numberOfLines={1} className="text-fg-muted">
            {formatSkinProfileShort(skinProfile, t)}
          </AppText>
        </View>
      </View>
      <AppText variant="captionSemibold" className="shrink-0 text-brand-primary">
        {action}
      </AppText>
    </Pressable>
  );
}
