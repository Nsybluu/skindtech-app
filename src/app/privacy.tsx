import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import { ActionRow } from '@/components/info/action-row';
import { InfoRow } from '@/components/info/info-row';
import { DeleteAccountSheet } from '@/components/privacy/delete-account-sheet';
import { AppIcon } from '@/components/ui/app-icon';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { IconContainer } from '@/components/ui/icon-container';
import { FaceSlightlySmilingIcon, FileTextIcon, ImageIcon, InfoIcon, RotateCcwClockIcon, ShieldCheckIcon, TrashIcon, UserRoundMinusIcon } from '@/components/ui/icons';
import { ListGroup } from '@/components/ui/list-group';
import { Notice } from '@/components/ui/notice';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Section } from '@/components/ui/section';
import { Toggle } from '@/components/ui/toggle';
import { useI18n } from '@/i18n/i18n-provider';
import { useSession, useUserData } from '@/providers/app-provider';
import { AccountDeletionController, type AccountDeletionSnapshot } from '@/services/account-deletion-controller';
import { accountService } from '@/services/account.service';
import { confirmDestructive, showMockupOnlyAlert } from '@/utils/alerts';
import { dataErrorMessage, dataErrorMessageForKind } from '@/utils/data-errors';

/** Figma 12 — Privacy & data */
export default function PrivacyScreen() {
  const { t } = useI18n();
  const { signOut } = useSession();
  const { aiImprovementConsent, isSavingConsent, refreshAiConsent, saveAiConsent, history } = useUserData();
  const [deletion, setDeletion] = useState<AccountDeletionSnapshot>({ busy: false, needsPassword: false });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [accountDeletion] = useState(
    () =>
      new AccountDeletionController(
        accountService,
        // The backend deleted the account and the tokens are gone: drop every local copy of the
        // user's data and leave the signed-in screens. The logout endpoint is not called.
        () => {
          router.dismissAll();
          signOut();
        },
        setDeletion,
      ),
  );

  // Show what the backend really has, not what this device last remembered.
  useEffect(() => {
    void refreshAiConsent();
  }, [refreshAiConsent]);

  const changeConsent = async (granted: boolean) => {
    try {
      await saveAiConsent(granted);
    } catch {
      // Nothing was saved, so the switch stays where it was.
      Alert.alert(t.consent.saveFailedTitle, t.consent.saveFailedBody, [{ text: t.common.ok }]);
    }
  };

  const anyDeletionRunning = history.deleting || deletion.busy;

  const deleteHistory = () => {
    if (anyDeletionRunning) return;
    confirmDestructive({
      title: t.privacy.deleteHistoryConfirmTitle,
      message: t.privacy.deleteHistoryConfirmBody,
      confirmLabel: t.common.delete,
      cancelLabel: t.common.cancel,
      onConfirm: async () => {
        try {
          // The history is cleared on this device only after the backend confirmed the deletion.
          if (await history.deleteAll()) {
            Alert.alert(t.privacy.deleteHistoryDoneTitle, t.privacy.deleteHistoryDoneBody, [{ text: t.common.ok }]);
          }
        } catch (error) {
          Alert.alert(t.privacy.deleteHistoryFailedTitle, dataErrorMessage(error, t), [{ text: t.common.ok }]);
        }
      },
    });
  };

  const deleteAccount = () => {
    if (anyDeletionRunning || deletion.needsPassword) return;
    confirmDestructive({
      title: t.privacy.deleteAccountConfirmTitle,
      message: t.privacy.deleteAccountConfirmBody,
      confirmLabel: t.common.delete,
      cancelLabel: t.common.cancel,
      onConfirm: async () => {
        setPasswordError(null);
        // Google accounts have no password and are deleted right away; an email account makes
        // the backend answer INVALID_CREDENTIALS, which opens the password sheet instead.
        const result = await accountDeletion.start();
        if (result.status === 'failed') {
          Alert.alert(t.privacy.deleteAccountFailedTitle, dataErrorMessageForKind(result.kind, t), [
            { text: t.common.ok },
          ]);
        }
      },
    });
  };

  const submitPassword = async (password: string) => {
    setPasswordError(null);
    const result = await accountDeletion.submitPassword(password);
    if (result.status === 'failed') {
      setPasswordError(
        result.kind === 'invalid-credentials'
          ? t.privacy.passwordSheet.wrongPassword
          : dataErrorMessageForKind(result.kind, t),
      );
    }
  };

  const closePasswordSheet = () => {
    setPasswordError(null);
    accountDeletion.cancel();
  };

  return (
    <AppScreen header={<ScreenHeader title={t.privacy.title} />} contentClassName="gap-4">
      <View className="min-h-[88px] flex-row items-center gap-3 rounded-lg bg-blush/[0.8] p-4">
        <IconContainer className="size-10 rounded-full bg-white/[0.7]">
          <AppIcon icon={ShieldCheckIcon} size={20} />
        </IconContainer>
        <View className="flex-1 gap-1">
          <AppText variant="cardTitle">{t.privacy.introTitle}</AppText>
          <AppText variant="bodySmall" className="text-fg-secondary">
            {t.privacy.introBody}
          </AppText>
        </View>
      </View>

      <Section title={t.privacy.dataUsed}>
        <ListGroup>
          <InfoRow
            icon={<AppIcon icon={ImageIcon} size={20} />}
            title={t.privacy.facePhotos}
            body={t.privacy.facePhotosBody}
            className="min-h-[72px]"
          />
          <InfoRow
            icon={<AppIcon icon={FaceSlightlySmilingIcon} size={20} />}
            title={t.privacy.skinProfile}
            body={t.privacy.skinProfileBody}
          />
          <InfoRow
            icon={<AppIcon icon={RotateCcwClockIcon} size={20} />}
            title={t.privacy.scanResults}
            body={t.privacy.scanResultsBody}
          />
        </ListGroup>
      </Section>

      <Section title={t.privacy.aiImprovement}>
        <View className="min-h-[84px] flex-row items-center gap-2 rounded-lg border border-line-subtle bg-surface-list p-3">
          <IconContainer className="size-9 rounded-full bg-white/[0.7]">
            <AppIcon icon={ShieldCheckIcon} size={20} />
          </IconContainer>
          <View className="flex-1">
            <AppText variant="titleSmall">{t.privacy.aiImprovementTitle}</AppText>
            <AppText variant="caption" className="text-fg-secondary">
              {t.privacy.aiImprovementBody}
            </AppText>
          </View>
          <Toggle
            value={aiImprovementConsent === true}
            onValueChange={(granted) => void changeConsent(granted)}
            disabled={isSavingConsent}
            accessibilityLabel={t.privacy.aiImprovementTitle}
          />
        </View>
      </Section>

      <Section title={t.privacy.yourControls}>
        <ListGroup>
          <ActionRow
            icon={<AppIcon icon={TrashIcon} size={18} />}
            label={history.deleting ? t.privacy.deletingHistory : t.privacy.deleteHistory}
            disabled={anyDeletionRunning}
            onPress={deleteHistory}
          />
          <ActionRow
            icon={<AppIcon icon={UserRoundMinusIcon} size={18} />}
            label={deletion.busy && !deletion.needsPassword ? t.privacy.deletingAccount : t.privacy.deleteAccount}
            emphasized
            disabled={anyDeletionRunning}
            onPress={deleteAccount}
          />
        </ListGroup>
      </Section>

      <Notice
        icon={<AppIcon icon={InfoIcon} size={18} />}
        tone="blush"
        title={t.privacy.noticeTitle}
        message={t.privacy.noticeBody}
        className="p-4"
      />

      <ActionRow
        standalone
        icon={<AppIcon icon={FileTextIcon} size={18} />}
        label={t.privacy.privacyPolicy}
        colorClassName="text-fg-primary"
        emphasized
        onPress={() => showMockupOnlyAlert(t, t.privacy.privacyPolicy.replace('  ›', ''))}
      />

      <AppText variant="footnote" className="text-center text-fg-muted">
        {t.privacy.policyNote}
      </AppText>

      <DeleteAccountSheet
        visible={deletion.needsPassword}
        busy={deletion.busy}
        error={passwordError}
        onSubmit={(password) => void submitPassword(password)}
        onClose={closePasswordSheet}
      />
    </AppScreen>
  );
}
