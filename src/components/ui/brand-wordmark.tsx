import { useI18n } from '@/i18n/i18n-provider';

import { AppText } from './app-text';

/** "SKINDTECH" letter-spaced wordmark used as the logo in headers. */
export function BrandWordmark() {
  const { t } = useI18n();

  return (
    <AppText variant="brand" align="center" accessibilityRole="header">
      {t.common.brand}
    </AppText>
  );
}
