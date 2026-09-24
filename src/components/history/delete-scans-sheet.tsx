import { ConfirmDeleteContent } from '@/components/ui/confirm-delete-content';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';

/** What the user is about to delete; chosen when the sheet opens, so it cannot change under them. */
export type DeleteScansTarget = { kind: 'all' } | { kind: 'some'; ids: string[] };

type DeleteScansSheetProps = {
  /** `null` = closed. */
  target: DeleteScansTarget | null;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

/** Confirmation for deleting one scan, several, or the whole history (Scan History › Manage). */
export function DeleteScansSheet({ target, busy, error, onConfirm, onClose }: DeleteScansSheetProps) {
  const { t } = useI18n();
  const count = target?.kind === 'some' ? target.ids.length : 0;

  const copy =
    target?.kind === 'all'
      ? { title: t.history.deleteAllTitle, message: t.history.deleteAllBody }
      : count === 1
        ? { title: t.history.deleteOneTitle, message: t.history.deleteOneBody }
        : { title: t.history.deleteManyTitle(count), message: t.history.deleteManyBody };

  return (
    <BottomSheet
      visible={target !== null}
      // A running request cannot be abandoned: closing would hide its outcome.
      onClose={busy ? () => {} : onClose}
      handleColor="rgba(201, 181, 174, 0.8)"
      bottomPadding={Spacing.l}>
      <ConfirmDeleteContent
        title={copy.title}
        message={copy.message}
        confirmLabel={target?.kind === 'all' ? t.history.deleteEverything : t.common.delete}
        busy={busy}
        error={error}
        onConfirm={onConfirm}
        onCancel={onClose}
      />
    </BottomSheet>
  );
}
