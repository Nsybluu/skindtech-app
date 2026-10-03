import { useState } from 'react';
import { View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppIcon } from '@/components/ui/app-icon';
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { IconContainer } from '@/components/ui/icon-container';
import { UserRoundMinusIcon } from '@/components/ui/icons';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';

type DeleteAccountSheetProps = {
  visible: boolean;
  /** The delete request is running: the sheet cannot be closed or submitted again. */
  busy: boolean;
  /** Why the last attempt failed, ready to show. */
  error: string | null;
  onSubmit: (password: string) => void;
  onClose: () => void;
};

/**
 * Asks for the account password before deleting an email/password account. A bottom sheet
 * instead of `Alert.prompt`, which exists on iOS only.
 *
 * The password lives in this component's state only while it is being typed: it is cleared the
 * moment it is submitted (a wrong one is retyped anyway) and whenever the sheet is closed.
 */
export function DeleteAccountSheet({ visible, busy, error, onSubmit, onClose }: DeleteAccountSheetProps) {
  const { t } = useI18n();
  const [password, setPassword] = useState('');

  const submit = () => {
    if (busy || password === '') return;
    const entered = password;
    setPassword('');
    onSubmit(entered);
  };

  const close = () => {
    if (busy) return;
    setPassword('');
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      keyboardAware
      bottomPadding={Spacing.l}
      className="bg-[rgba(255,253,252,0.99)]">
      <View className="flex-row items-start gap-3 py-1">
        <IconContainer className="size-10 rounded-full bg-danger-surface">
          <AppIcon icon={UserRoundMinusIcon} size={20} color={Colors.danger.text} />
        </IconContainer>
        <View className="flex-1 gap-1">
          <AppText variant="headline" accessibilityRole="header">
            {t.privacy.passwordSheet.title}
          </AppText>
          <AppText variant="body" className="text-fg-secondary">
            {t.privacy.passwordSheet.body}
          </AppText>
        </View>
      </View>

      <AppInput
        label={t.privacy.passwordSheet.label}
        value={password}
        onChangeText={setPassword}
        secure
        editable={!busy}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      {error ? (
        <AppText
          variant="bodySmall"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          className="text-danger-text">
          {error}
        </AppText>
      ) : null}

      <View className="flex-row gap-3">
        <AppButton
          variant="secondary"
          label={t.common.cancel}
          onPress={close}
          disabled={busy}
          className="w-[104px] border-rose/[0.32] bg-white/[0.75]"
        />
        <AppButton
          variant="destructive"
          label={busy ? t.privacy.passwordSheet.deleting : t.privacy.passwordSheet.confirm}
          onPress={submit}
          disabled={busy || password === ''}
          className="flex-1"
        />
      </View>
    </BottomSheet>
  );
}
