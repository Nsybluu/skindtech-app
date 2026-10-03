import { Pressable, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { IconContainer } from '@/components/ui/icon-container';
import { ScanFaceIcon } from '@/components/ui/icons';
import { useI18n } from '@/i18n/i18n-provider';
import type { ScanResult } from '@/types/scan';
import { formatScanDate } from '@/utils/format';

type LatestResultCardProps = {
  result: ScanResult;
  onPress: () => void;
};

/** Figma "Latest Result / Populated State". */
export function LatestResultCard({ result, onPress }: LatestResultCardProps) {
  const { t, language } = useI18n();
  const summary = t.result.summary(result.amount, result.severity);

  return (
    <View className="gap-3">
      <AppText variant="sectionTitle" accessibilityRole="header">
        {t.home.latestResult}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={summary}
        onPress={onPress}
        className="min-h-[76px] flex-row items-center gap-3 rounded-lg border border-line-card bg-surface-card p-4 active:opacity-[0.85]">
        <IconContainer className="size-11 rounded-lg">
          <AppIcon icon={ScanFaceIcon} size={22} />
        </IconContainer>
        <View className="flex-1 gap-0.5">
          <AppText variant="cardTitle" numberOfLines={2}>
            {summary}
          </AppText>
          <AppText variant="caption" className="text-fg-secondary">
            {formatScanDate(result.scannedAt, { language, todayLabel: t.result.today, relative: true })}
          </AppText>
        </View>
      </Pressable>
    </View>
  );
}
