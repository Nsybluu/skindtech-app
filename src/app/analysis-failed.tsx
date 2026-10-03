import { router } from 'expo-router';
import { View } from 'react-native';

import { ActionBar } from '@/components/ui/action-bar';
import { AppButton } from '@/components/ui/app-button';
import { AppIcon } from '@/components/ui/app-icon';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { InfoIcon } from '@/components/ui/icons';
import { ScreenHeader, goBackOr } from '@/components/ui/screen-header';
import { useI18n } from '@/i18n/i18n-provider';

/** Figma 07D — Analysis Failed. */
export default function AnalysisFailedScreen() {
  const { t } = useI18n();
  const backToScan = () => goBackOr(() => router.replace('/scan'));

  return (
    <AppScreen
      header={<ScreenHeader title={t.analysisFailed.title} className="gap-3" onBack={backToScan} />}
      contentClassName="grow items-center justify-center gap-4 py-8"
      footer={
        <ActionBar>
          <AppButton
            variant="secondary"
            label={t.analysisFailed.backToScan}
            onPress={backToScan}
            className="w-[104px]"
          />
          <AppButton
            variant="solid"
            label={t.analysisFailed.tryAgain}
            onPress={() => router.replace('/analyzing')}
            className="flex-1"
          />
        </ActionBar>
      }>
      <View className="size-16 items-center justify-center rounded-full border border-error-icon-border bg-error-icon-surface">
        <AppIcon icon={InfoIcon} size={24} />
      </View>

      <AppText variant="headline" className="text-center text-error-title">
        {t.analysisFailed.heading}
      </AppText>
      <AppText variant="body" className="text-center text-error-body">
        {t.analysisFailed.body}
      </AppText>

      <View className="gap-2 self-stretch rounded-lg border border-error-card-border bg-white p-4">
        <AppText variant="cardTitle" className="text-error-title">
          {t.analysisFailed.whatYouCanDo}
        </AppText>
        <View className="gap-1">
          {t.analysisFailed.tips.map((tip) => (
            <AppText key={tip} variant="bodySmall" className="text-error-text">
              {`•  ${tip}`}
            </AppText>
          ))}
        </View>
      </View>

      <View className="flex-row items-center gap-3 self-stretch rounded-lg border border-error-notice-border bg-error-notice-surface p-3">
        <AppIcon icon={InfoIcon} size={18} />
        <AppText variant="caption" className="flex-1 text-error-text">
          {t.analysisFailed.notSaved}
        </AppText>
      </View>
    </AppScreen>
  );
}
