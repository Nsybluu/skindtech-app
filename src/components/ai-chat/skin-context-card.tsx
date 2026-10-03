import { View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { IconContainer } from '@/components/ui/icon-container';
import { FaceSlightlySmilingIcon } from '@/components/ui/icons';
import { useI18n } from '@/i18n/i18n-provider';
import { useUserData } from '@/providers/app-provider';
import { getDetectedCategories } from '@/utils/format';

/**
 * Figma "Card / Current Skin Context" — shows which data the assistant is using.
 * Reads the scan history and Skin Profile as loaded from the backend.
 */
export function SkinContextCard() {
  const { t } = useI18n();
  const { history, skinProfile } = useUserData();
  const latestScan = history.scans[0];

  const scanLine = latestScan
    ? t.aiChat.contextScan(
        t.result.severityValue[latestScan.severity],
        t.result.categoryList(getDetectedCategories(latestScan)),
      )
    : t.aiChat.contextScanEmpty;

  const profileLine = skinProfile
    ? t.aiChat.contextProfile(
        t.skinProfileSummary.skinTypeShort[skinProfile.skinType],
        t.skinProfileSummary.sensitivity[skinProfile.sensitivity],
      )
    : t.aiChat.contextProfileEmpty;

  return (
    <View className="flex-row items-center gap-3 rounded-lg border border-line-brand bg-surface-card-strong p-3">
      <IconContainer className="size-10 rounded-md bg-peach/[0.24]">
        <AppIcon icon={FaceSlightlySmilingIcon} size={18} />
      </IconContainer>
      <View className="flex-1">
        <AppText variant="titleSmall">{t.aiChat.contextTitle}</AppText>
        <AppText variant="caption" numberOfLines={2} className="text-fg-muted">
          {scanLine}
        </AppText>
        <AppText variant="caption" numberOfLines={2} className="text-fg-muted">
          {profileLine}
        </AppText>
      </View>
    </View>
  );
}
