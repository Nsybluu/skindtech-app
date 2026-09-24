import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppIcon } from '@/components/ui/app-icon';
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { IconContainer } from '@/components/ui/icon-container';
import { UserRoundMinusIcon } from '@/components/ui/icons';
import { Alpha, Colors } from '@/constants/colors';
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
      handleColor="rgba(201, 181, 174, 0.8)"
      bottomPadding={Spacing.l}
      style={styles.sheet}>
      <View style={styles.intro}>
        <IconContainer size={40} radius={20} backgroundColor={Alpha.white(0.7)}>
          <AppIcon icon={UserRoundMinusIcon} size={20} />
        </IconContainer>
        <View style={styles.introCopy}>
          <AppText variant="sheetTitle" accessibilityRole="header">
            {t.privacy.passwordSheet.title}
          </AppText>
          <AppText variant="caption" color={Colors.text.secondary}>
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
          variant="caption"
          color={Colors.brand.primary}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}

      <View style={styles.actions}>
        <AppButton
          variant="secondary"
          label={t.common.cancel}
          onPress={close}
          disabled={busy}
          textVariant="button"
          style={styles.secondary}
        />
        <AppButton
          variant="solid"
          label={busy ? t.privacy.passwordSheet.deleting : t.privacy.passwordSheet.confirm}
          onPress={submit}
          disabled={busy || password === ''}
          textVariant="button"
          style={styles.primary}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: 'rgba(255, 253, 252, 0.99)',
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
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
