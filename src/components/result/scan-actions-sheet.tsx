import { useState } from 'react';
import { Pressable } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { ConfirmDeleteContent } from '@/components/ui/confirm-delete-content';
import { TrashIcon } from '@/components/ui/icons';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';

type ScanActionsSheetProps = {
  visible: boolean;
  /** The delete request is running. */
  busy: boolean;
  /** Why the last delete failed, ready to show. Nothing was deleted. */
  error: string | null;
  onDelete: () => void;
  onClose: () => void;
};

/**
 * The "•••" menu of a scan result. Choosing "Delete" opens the confirmation inside the same
 * sheet: a second sheet or an `Alert` opened while this modal is still closing is not reliable on iOS.
 */
export function ScanActionsSheet({ visible, busy, error, onDelete, onClose }: ScanActionsSheetProps) {
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(false);

  const close = () => {
    if (busy) return;
    setConfirming(false);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={close} bottomPadding={Spacing.l}>
      {confirming ? (
        <ConfirmDeleteContent
          title={t.history.deleteOneTitle}
          message={t.history.deleteOneBody}
          confirmLabel={t.common.delete}
          busy={busy}
          error={error}
          onConfirm={onDelete}
          onCancel={close}
        />
      ) : (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.result.deleteThisScan}
            onPress={() => setConfirming(true)}
            className="min-h-14 flex-row items-center gap-3 rounded-lg border border-danger-border bg-danger-surface px-4 active:bg-rose/[0.12]">
            <AppIcon icon={TrashIcon} size={20} color={Colors.danger.text} />
            <AppText variant="button" className="flex-1 text-danger-text">
              {t.result.deleteThisScan}
            </AppText>
          </Pressable>
          <AppButton variant="secondary" label={t.common.cancel} onPress={close} />
        </>
      )}
    </BottomSheet>
  );
}
