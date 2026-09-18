import type { ReactNode } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import InfoIcon from '@/assets/icons/info.svg';
import { ActionBar } from '@/components/ui/action-bar';
import { IconButton } from '@/components/ui/icon-button';
import { ScreenBackground } from '@/components/ui/screen-background';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Colors } from '@/constants/colors';
import { Layout, Radius, Shadows, Spacing } from '@/constants/spacing';
import { useDesignInsets } from '@/hooks/use-design-insets';
import { useI18n } from '@/i18n/i18n-provider';

import { SkinProfileSummary } from './skin-profile-summary';

type ScanFlowLayoutProps = {
  title: string;
  titleVariant?: 'screenTitle' | 'screenTitleSmall';
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
  titleVariant = 'screenTitle',
  onBack,
  preview,
  controls,
  actions,
}: ScanFlowLayoutProps) {
  const { t } = useI18n();
  const { top, bottom } = useDesignInsets();

  return (
    <ScreenBackground>
      <View style={[styles.top, { paddingTop: top(40) }]}>
        <ScreenHeader
          title={title}
          titleVariant={titleVariant}
          onBack={onBack}
          accessory={
            <IconButton
              tone="emphasis"
              accessibilityLabel={t.scan.scanTips}
              onPress={() => Alert.alert(t.scan.scanTips, t.scan.scanTipsBody, [{ text: t.common.ok }])}>
              <InfoIcon />
            </IconButton>
          }
        />
        <SkinProfileSummary />
      </View>

      <View style={styles.previewArea}>{preview}</View>

      <View style={[styles.sheet, { paddingBottom: actions ? Spacing.xl : bottom(Spacing.xl) }]}>
        <View style={styles.sheetContent}>{controls}</View>
      </View>

      {actions ? <ActionBar>{actions}</ActionBar> : null}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  top: {
    width: '100%',
    maxWidth: Layout.maxContentWidth + Layout.screenPadding * 2,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPadding,
    gap: Spacing.m,
  },
  previewArea: {
    flex: 1,
    width: '100%',
    maxWidth: Layout.maxContentWidth + Layout.screenPadding * 2,
    alignSelf: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.l,
    paddingBottom: Spacing.l,
  },
  sheet: {
    paddingTop: Spacing.l,
    paddingHorizontal: Layout.screenPadding,
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    backgroundColor: Colors.surface.bar,
    boxShadow: Shadows.barUp,
  },
  sheetContent: {
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
    alignItems: 'stretch',
    gap: Spacing.m,
  },
});
