import { View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { IconContainer } from '@/components/ui/icon-container';
import { TrashIcon } from '@/components/ui/icons';
import { Colors } from '@/constants/colors';
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
      <View className="flex-row items-start gap-3 py-1">
        <IconContainer className="size-10 rounded-full bg-danger-surface">
          <AppIcon icon={TrashIcon} size={20} color={Colors.danger.text} />
        </IconContainer>
        <View className="flex-1 gap-1">
          <AppText variant="headline" accessibilityRole="header">
            {title}
          </AppText>
          <AppText variant="body" className="text-fg-secondary">
            {message}
          </AppText>
        </View>
      </View>

      {error ? (
        <AppText
          variant="bodySmall"
          className="text-danger-text"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}

      <View className="flex-row gap-3">
        <AppButton
          variant="secondary"
          label={t.common.cancel}
          onPress={onCancel}
          disabled={busy}
          className="w-[104px] border-rose/[0.32] bg-white/[0.75]"
        />
        <AppButton
          variant="destructive"
          label={busy ? t.history.deleting : confirmLabel}
          onPress={onConfirm}
          disabled={busy}
          className="flex-1"
        />
      </View>
    </>
  );
}
