import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { LatestResultCard } from '@/components/home/latest-result-card';
import { ScanTipsRow } from '@/components/home/scan-tips-row';
import { StartScanCard } from '@/components/home/start-scan-card';
import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { BrandWordmark } from '@/components/ui/brand-wordmark';
import { InfoIcon } from '@/components/ui/icons';
import { Notice } from '@/components/ui/notice';
import { ScreenBackground } from '@/components/ui/screen-background';
import { Colors } from '@/constants/colors';
import { Layout, Radius, Spacing } from '@/constants/spacing';
import { useDesignInsets } from '@/hooks/use-design-insets';
import { useStartScan } from '@/hooks/use-start-scan';
import { useI18n } from '@/i18n/i18n-provider';
import { useUserData } from '@/providers/app-provider';
import { getGreetingPeriod } from '@/utils/format';

/** Figma 04 — Home */
export default function HomeScreen() {
  const { t } = useI18n();
  const { user, scanHistory } = useUserData();
  const { top } = useDesignInsets();
  const startScan = useStartScan();
  const latestResult = scanHistory[0];

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: top(50) }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.constrained}>
          <View style={styles.header}>
            <BrandWordmark />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.home.openProfile}
              onPress={() => router.navigate('/account')}
              style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
              <AppText variant="bodyLarge" weight="semibold" color={Colors.brand.primary}>
                {user.name.charAt(0).toUpperCase()}
              </AppText>
            </Pressable>
          </View>

          <View style={styles.greeting}>
            <AppText variant="greeting" accessibilityRole="header">
              {t.home.greeting(getGreetingPeriod(), user.name)}
            </AppText>
            <AppText variant="body" color={Colors.text.secondary}>
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
          ) : null}

          <Notice
            icon={<AppIcon icon={InfoIcon} size={18} />}
            message={t.home.disclaimer}
            messageVariant="caption"
            style={styles.notice}
          />
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: Layout.screenPadding,
    // Clears the floating tab bar.
    paddingBottom: Layout.tabBarClearance,
  },
  constrained: {
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
    gap: Spacing.xl,
  },
  header: {
    height: Layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border.button,
  },
  greeting: {
    gap: Spacing.xs,
  },
  notice: {
    paddingVertical: Spacing.m,
    borderRadius: Radius.l,
  },
  pressed: {
    opacity: 0.7,
  },
});
