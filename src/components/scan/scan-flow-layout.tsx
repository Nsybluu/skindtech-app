import type { ReactNode } from 'react';
import { Alert, View } from 'react-native';

import { ActionBar } from '@/components/ui/action-bar';
import { AppIcon } from '@/components/ui/app-icon';
import { IconButton } from '@/components/ui/icon-button';
import { InfoIcon } from '@/components/ui/icons';
import { ScreenBackground } from '@/components/ui/screen-background';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Effects } from '@/constants/effects';
import { Spacing } from '@/constants/spacing';
import { useDesignInsets } from '@/hooks/use-design-insets';
import { useI18n } from '@/i18n/i18n-provider';

import { SkinProfileSummary } from './skin-profile-summary';

type ScanFlowLayoutProps = {
  title: string;
  onBack?: () => void;
  /** The camera / photo preview (fills the remaining height). */
  preview: ReactNode;
  /** Content of the white rounded controls sheet. */
  controls: ReactNode;
  /** Optional buttons for the bottom action bar. */
  actions?: ReactNode;
};

/**
 * Shared frame for 07 Scan, 07A Photo Review, 07B Image Quality Issue and
 * 07C Analyzing: header, Skin Profile summary, preview, controls sheet.
 */
export function ScanFlowLayout({
  title,
  onBack,
  preview,
  controls,
  actions,
}: ScanFlowLayoutProps) {
  const { t } = useI18n();
  const { top, bottom } = useDesignInsets();

  return (
    <ScreenBackground>
      {/* `max-w-[520px]` = content width 480 + 2 × the 20pt screen padding. */}
      <View className="w-full max-w-[520px] gap-3 self-center px-5" style={{ paddingTop: top(40) }}>
        <ScreenHeader
          title={title}
          onBack={onBack}
          accessory={
            <IconButton
              tone="emphasis"
              accessibilityLabel={t.scan.scanTips}
              onPress={() => Alert.alert(t.scan.scanTips, t.scan.scanTipsBody, [{ text: t.common.ok }])}>
              <AppIcon icon={InfoIcon} size={18} />
            </IconButton>
          }
        />
        <SkinProfileSummary />
      </View>

      <View className="w-full max-w-[520px] flex-1 self-center px-5 py-4">{preview}</View>

      <View
        className={`rounded-t-sheet bg-surface-bar px-5 pt-4 ${actions ? 'pb-5' : ''}`}
        // Without an action bar the sheet's bottom padding follows the safe area (runtime value).
        style={[Effects.shadowBarUp, actions ? null : { paddingBottom: bottom(Spacing.xl) }]}>
        <View className="w-full max-w-content items-stretch gap-3 self-center">{controls}</View>
      </View>

      {actions ? <ActionBar>{actions}</ActionBar> : null}
    </ScreenBackground>
  );
}
