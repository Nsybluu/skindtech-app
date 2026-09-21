import { StyleSheet } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { InfoIcon } from '@/components/ui/icons';
import { Notice } from '@/components/ui/notice';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';

/** "Notice / Photo Quality" row at the top of the scan controls sheet. */
export function ScanNotice({ message }: { message: string }) {
  return <Notice icon={<AppIcon icon={InfoIcon} size={18} />} message={message} style={styles.notice} />;
}

/** Small centered helper line under the scan controls. */
export function ScanNote({ message, variant = 'footnote' }: { message: string; variant?: 'footnote' | 'micro' }) {
  return (
    <AppText variant={variant} color={Colors.text.muted} align="center" style={styles.note}>
      {message}
    </AppText>
  );
}

const styles = StyleSheet.create({
  notice: {
    paddingVertical: Spacing.m,
  },
  note: {
    paddingHorizontal: Spacing.s,
  },
});
