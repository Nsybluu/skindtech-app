import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

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
import { Toggle } from '@/components/ui/toggle';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
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
    <AppScreen
      header={<ScreenHeader title={t.privacy.title} titleVariant="screenTitle" />}
      gap={Spacing.l}>
      <View style={styles.intro}>
        <IconContainer size={40} radius={20} backgroundColor={Alpha.white(0.7)}>
          <AppIcon icon={ShieldCheckIcon} size={20} />
        </IconContainer>
        <View style={styles.introCopy}>
          <AppText variant="titleSmall">{t.privacy.introTitle}</AppText>
          <AppText variant="footnote" color={Colors.text.secondary}>
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
            bodyVariant="footnote"
            minHeight={72}
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
        <View style={styles.consentCard}>
          <IconContainer size={36} radius={20} backgroundColor={Alpha.white(0.7)}>
            <AppIcon icon={ShieldCheckIcon} size={20} />
          </IconContainer>
          <View style={styles.consentCopy}>
            <AppText variant="label">{t.privacy.aiImprovementTitle}</AppText>
            <AppText variant="footnote" color={Colors.text.secondary}>
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
            weight="semibold"
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
        messageVariant="caption"
        style={styles.notice}
      />

      <ActionRow
        standalone
        icon={<AppIcon icon={FileTextIcon} size={18} />}
        label={t.privacy.privacyPolicy}
        color={Colors.text.primary}
        weight="semibold"
        onPress={() => showMockupOnlyAlert(t, t.privacy.privacyPolicy.replace('  ›', ''))}
      />

      <AppText variant="footnote" color={Colors.text.muted} align="center">
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="titleSmall" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    padding: Spacing.l,
    borderRadius: Radius.l,
    backgroundColor: Alpha.blush(0.8),
  },
  introCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  section: {
    gap: Spacing.m,
  },
  consentCard: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    padding: Spacing.m,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.surface.list,
  },
  consentCopy: {
    flex: 1,
  },
  notice: {
    gap: Spacing.m,
    padding: Spacing.l,
    borderRadius: Radius.l,
  },
});
