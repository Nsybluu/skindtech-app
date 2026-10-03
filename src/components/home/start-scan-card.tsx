import { View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { Image } from '@/components/ui/styled';
import { Effects } from '@/constants/effects';
import { useI18n } from '@/i18n/i18n-provider';

type StartScanCardProps = {
  onStartScan: () => void;
};

/** Figma "Card / Start Skin Check". */
export function StartScanCard({ onStartScan }: StartScanCardProps) {
  const { t } = useI18n();

  return (
    <View
      className="min-h-48 flex-row items-center justify-between rounded-2xl border border-line-brand bg-canvas-base p-5"
      style={Effects.scanCard}>
      <View className="flex-1 gap-3">
        <AppText variant="headline">{t.home.scanCardTitle}</AppText>
        <AppText variant="body" className="text-fg-secondary">
          {t.home.scanCardBody}
        </AppText>
        <AppButton
          label={t.home.startScan}
          onPress={onStartScan}
          className="mt-1 h-11 self-start px-5"
        />
      </View>
      <Image
        source={require('@/assets/images/face-scan-illustration.png')}
        contentFit="contain"
        className="h-[156px] w-[108px]"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}
