import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { IconContainer } from '@/components/ui/icon-container';
import { TrashIcon } from '@/components/ui/icons';
import { Alpha, Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';

type ConfirmDeleteContentProps = {
  title: string;
  message: string;
  /** Label of the destructive button ("Delete"). */
  confirmLabel: string;
  /** The request is running: both buttons are locked, so it cannot be sent twice or abandoned. */
  busy: boolean;
  /** Why the last attempt failed, ready to show. Nothing was deleted. */
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * The body of a "delete this?" confirmation, for use inside a `BottomSheet`. One in-app dialog
 * for every platform, so the confirm button really is destructive-coloured on Android too
 * (a native `Alert` cannot colour its buttons there).
 */
export function ConfirmDeleteContent({
  title,
  message,
  confirmLabel,
  busy,
  error,
  onConfirm,
  onCancel,
}: ConfirmDeleteContentProps) {
  const { t } = useI18n();

  return (
    <>
      <View style={styles.intro}>
        <IconContainer size={40} radius={20} backgroundColor={Colors.danger.surface}>
          <AppIcon icon={TrashIcon} size={20} color={Colors.danger.text} />
        </IconContainer>
        <View style={styles.introCopy}>
          <AppText variant="sheetTitle" accessibilityRole="header">
            {title}
          </AppText>
          <AppText variant="caption" color={Colors.text.secondary}>
            {message}
          </AppText>
        </View>
      </View>

      {error ? (
        <AppText
          variant="caption"
          color={Colors.danger.text}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}

      <View style={styles.actions}>
        <AppButton
          variant="secondary"
          label={t.common.cancel}
          onPress={onCancel}
          disabled={busy}
          textVariant="button"
          style={styles.secondary}
        />
        <AppButton
          variant="destructive"
          label={busy ? t.history.deleting : confirmLabel}
          onPress={onConfirm}
          disabled={busy}
          style={styles.primary}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  intro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.m,
    paddingVertical: Spacing.xs,
  },
  introCopy: {
    flex: 1,
    gap: Spacing.xxs,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.m,
  },
  secondary: {
    width: 104,
    borderColor: Alpha.rose(0.32),
    backgroundColor: Alpha.white(0.75),
  },
  primary: {
    flex: 1,
  },
});
