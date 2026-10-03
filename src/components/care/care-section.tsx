import type { ReactNode } from 'react';
import { View } from 'react-native';

import { CareGuidance } from '@/components/care/care-guidance';
import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { InfoIcon } from '@/components/ui/icons';
import { StateCard } from '@/components/ui/state-card';
import { useI18n } from '@/i18n/i18n-provider';
import { demoCareContent } from '@/mocks/care';
import type { RecommendationState } from '@/services/recommendation-controller';
import { dataErrorMessageForKind } from '@/utils/data-errors';

type CareSectionProps = {
  /** A demo scan never reached the backend, so it has no recommendation to ask for. */
  isDemo: boolean;
  state: RecommendationState;
  onRetry: () => void;
};

/**
 * The "Basic care" part of Scan Result. Loading and failure stay INSIDE this section: the scan
 * result above it is already complete and stays readable whatever happens here.
 */
export function CareSection({ isDemo, state, onRetry }: CareSectionProps) {
  const { t } = useI18n();

  if (isDemo) return <CareGuidance content={demoCareContent} demo />;
  if (state.status === 'ready') return <CareGuidance content={state.recommendation.content} />;

  return (
    <Shell title={t.care.sectionTitle}>
      {state.status === 'not-found' ? (
        <StateCard
          icon={<AppIcon icon={InfoIcon} size={22} />}
          title={t.care.notFoundTitle}
          body={t.care.notFoundBody}
          actionLabel={t.common.retry}
          onAction={onRetry}
        />
      ) : state.status === 'error' ? (
        <StateCard
          icon={<AppIcon icon={InfoIcon} size={22} />}
          title={t.care.loadFailedTitle}
          body={dataErrorMessageForKind(state.kind, t)}
          // A dead session is being signed out already: retrying would not help.
          actionLabel={state.kind === 'session' ? undefined : t.common.retry}
          onAction={onRetry}
        />
      ) : (
        // `idle` is the instant before the request starts: it looks the same, so nothing jumps.
        <StateCard loading title={t.care.loading} />
      )}
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <AppText variant="sectionTitle" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
}
