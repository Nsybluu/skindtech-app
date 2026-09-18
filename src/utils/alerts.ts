import { Alert } from 'react-native';

import type { Translations } from '@/i18n/en';

/** For actions that exist in Figma but have no backend behind them yet. */
export function showMockupOnlyAlert(t: Translations, title?: string) {
  Alert.alert(title ?? t.common.mockupOnlyTitle, t.common.mockupOnlyBody, [{ text: t.common.ok }]);
}

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
};

export function confirmDestructive({ title, message, confirmLabel, cancelLabel, onConfirm }: ConfirmOptions) {
  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
