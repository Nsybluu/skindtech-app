import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { LatestResultCard } from '@/components/home/latest-result-card';
import { LatestResultStatus } from '@/components/home/latest-result-status';
import { ScanTipsRow } from '@/components/home/scan-tips-row';
import { StartScanCard } from '@/components/home/start-scan-card';
import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { BrandWordmark } from '@/components/ui/brand-wordmark';
import { InfoIcon } from '@/components/ui/icons';
import { Notice } from '@/components/ui/notice';
import { ScreenBackground } from '@/components/ui/screen-background';
import { useDesignInsets } from '@/hooks/use-design-insets';
import { useStartScan } from '@/hooks/use-start-scan';
import { useI18n } from '@/i18n/i18n-provider';
import { useUserData } from '@/providers/app-provider';
import { getGreetingPeriod } from '@/utils/format';

/** Figma 04 — Home */
export default function HomeScreen() {
  const { t } = useI18n();
  const { user, history } = useUserData();
  const { top } = useDesignInsets();
  const startScan = useStartScan();
  const latestResult = history.scans[0];
  // No latest result to show is not the same as "never scanned": the history may still be loading,
  // may have failed to load, or the loaded scans were just deleted while older ones remain.
  const latestStatus =
    latestResult || history.status === 'idle'
      ? null
      : history.status === 'ready' && !history.hasMore
        ? null
        : history.status === 'failed' || (history.status === 'ready' && history.loadError)
          ? 'failed'
          : 'loading';

  return (
    <ScreenBackground>
      <ScrollView
        // `pb-28` clears the floating tab bar; the top padding follows the status bar (runtime value).
        contentContainerClassName="grow px-5 pb-28"
        contentContainerStyle={{ paddingTop: top(50) }}
        showsVerticalScrollIndicator={false}>
        <View className="w-full max-w-content gap-5 self-center">
          <View className="h-11 flex-row items-center justify-between">
            <BrandWordmark />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.home.openProfile}
              onPress={() => router.navigate('/account')}
              className="size-10 items-center justify-center rounded-full border border-line-button bg-white active:opacity-70">
              <AppText variant="cardTitle" className="text-brand-primary">
                {user.name.charAt(0).toUpperCase()}
              </AppText>
            </Pressable>
          </View>

          <View className="gap-1">
            <AppText variant="greeting" accessibilityRole="header">
              {t.home.greeting(getGreetingPeriod(), user.name)}
            </AppText>
            <AppText variant="body" className="text-fg-secondary">
              {t.home.subtitle}
            </AppText>
          </View>

          <StartScanCard onStartScan={startScan} />

          <ScanTipsRow />

          {latestResult ? (
            <LatestResultCard
              result={latestResult}
              onPress={() => router.push({ pathname: '/scan-result', params: { id: latestResult.id } })}
            />
          ) : latestStatus ? (
            <LatestResultStatus
              status={latestStatus}
              onRetry={() => void (history.status === 'ready' ? history.loadMore() : history.refresh())}
            />
          ) : null}

          <Notice
            icon={<AppIcon icon={InfoIcon} size={18} />}
            message={t.home.disclaimer}
            className="py-3"
          />
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}
