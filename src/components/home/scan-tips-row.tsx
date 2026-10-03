import { View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { ImageOffIcon, ScanFaceIcon, SunIcon, type LucideIcon } from '@/components/ui/icons';
import { useI18n } from '@/i18n/i18n-provider';

/** Figma "Tips / Before You Scan" — three quick-check tiles. */
export function ScanTipsRow() {
  const { t } = useI18n();

  const tips: { key: string; label: string; icon: LucideIcon }[] = [
    { key: 'lighting', label: t.home.tipGoodLighting, icon: SunIcon },
    { key: 'face-forward', label: t.home.tipFaceForward, icon: ScanFaceIcon },
    { key: 'no-filters', label: t.home.tipNoFilters, icon: ImageOffIcon },
  ];

  return (
    <View className="gap-3">
      <AppText variant="sectionTitle" accessibilityRole="header">
        {t.home.beforeYouScan}
      </AppText>
      <View className="flex-row gap-2">
        {tips.map(({ key, label, icon }) => (
          <View
            key={key}
            className="min-h-[84px] flex-1 items-center justify-center gap-2 rounded-lg border border-line-card bg-surface-card px-2 py-3">
            <AppIcon icon={icon} size={24} />
            <AppText variant="bodySmall" numberOfLines={2} className="text-center text-fg-secondary">
              {label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}
