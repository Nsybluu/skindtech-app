import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { ConfirmDeleteContent } from '@/components/ui/confirm-delete-content';
import { TrashIcon } from '@/components/ui/icons';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
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
    <BottomSheet
      visible={visible}
      onClose={close}
      handleColor="rgba(201, 181, 174, 0.8)"
      bottomPadding={Spacing.l}>
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
            style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
            <AppIcon icon={TrashIcon} size={20} color={Colors.danger.text} />
            <AppText variant="label" color={Colors.danger.text} style={styles.optionLabel}>
              {t.result.deleteThisScan}
            </AppText>
          </Pressable>
          <AppButton variant="secondary" label={t.common.cancel} onPress={close} textVariant="button" />
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  option: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    paddingHorizontal: Spacing.l,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Colors.danger.border,
    backgroundColor: Colors.danger.surface,
  },
  optionLabel: {
    flex: 1,
  },
  pressed: {
    backgroundColor: Alpha.rose(0.12),
  },
});
