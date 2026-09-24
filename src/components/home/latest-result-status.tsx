import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { InfoIcon } from '@/components/ui/icons';
import { StateCard } from '@/components/ui/state-card';
import { Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';

type LatestResultStatusProps = {
  status: 'loading' | 'failed';
  onRetry: () => void;
};

/**
 * "Latest result" while the history is loading, or when it could not be loaded. A failed load
 * must not look like "never scanned", so it says so and offers a retry.
 */
export function LatestResultStatus({ status, onRetry }: LatestResultStatusProps) {
  const { t } = useI18n();

  return (
    <View style={styles.section}>
      <AppText variant="sectionTitle" accessibilityRole="header">
        {t.home.latestResult}
      </AppText>
      {status === 'loading' ? (
        <StateCard loading title={t.home.latestResultLoading} />
      ) : (
        <StateCard
          icon={<AppIcon icon={InfoIcon} size={22} />}
          title={t.home.latestResultFailedTitle}
          body={t.home.latestResultFailedBody}
          actionLabel={t.common.retry}
          onAction={onRetry}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.m,
  },
});
