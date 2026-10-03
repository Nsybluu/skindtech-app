import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { InfoIcon } from '@/components/ui/icons';
import { Notice } from '@/components/ui/notice';

/** "Notice / Photo Quality" row at the top of the scan controls sheet. */
export function ScanNotice({ message }: { message: string }) {
  return <Notice icon={<AppIcon icon={InfoIcon} size={18} />} message={message} className="py-3" />;
}

/** Small centered helper line under the scan controls. */
export function ScanNote({ message, variant = 'footnote' }: { message: string; variant?: 'footnote' | 'micro' }) {
  return (
    <AppText variant={variant} className="px-2 text-center text-fg-muted">
      {message}
    </AppText>
  );
}
