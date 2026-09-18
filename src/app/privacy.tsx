import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import DeleteAccountIcon from '@/assets/icons/delete-account.svg';
import DocumentIcon from '@/assets/icons/document.svg';
import InfoImportantIcon from '@/assets/icons/info-important.svg';
import PhotoIcon from '@/assets/icons/photo.svg';
import ScanResultsIcon from '@/assets/icons/scan-results.svg';
import ShieldIcon from '@/assets/icons/shield.svg';
import SkinProfileLargeIcon from '@/assets/icons/skin-profile-large.svg';
import TrashIcon from '@/assets/icons/trash.svg';
import { ActionRow } from '@/components/info/action-row';
import { InfoRow } from '@/components/info/info-row';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { IconContainer } from '@/components/ui/icon-container';
import { ListGroup } from '@/components/ui/list-group';
import { Notice } from '@/components/ui/notice';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Toggle } from '@/components/ui/toggle';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';
import { useSession, useUserData } from '@/providers/app-provider';
import { authService } from '@/services/auth.service';
import { scanService } from '@/services/scan.service';
import { confirmDestructive, showMockupOnlyAlert } from '@/utils/alerts';

/** Figma 12 — Privacy & data */
export default function PrivacyScreen() {
  const { t } = useI18n();
  const { signOut } = useSession();
  const { aiImprovementConsent, setAiImprovementConsent, clearScanHistory } = useUserData();

  const deleteHistory = () =>
    confirmDestructive({
      title: t.privacy.deleteHistoryConfirmTitle,
      message: t.privacy.deleteHistoryConfirmBody,
      confirmLabel: t.common.delete,
      cancelLabel: t.common.cancel,
      onConfirm: async () => {
        await scanService.deleteHistory();
        clearScanHistory();
      },
    });

  const deleteAccount = () =>
    confirmDestructive({
      title: t.privacy.deleteAccountConfirmTitle,
      message: t.privacy.deleteAccountConfirmBody,
      confirmLabel: t.common.delete,
      cancelLabel: t.common.cancel,
      onConfirm: async () => {
        await authService.signOut();
        router.dismissAll();
        signOut();
      },
    });

  return (
    <AppScreen
      header={<ScreenHeader title={t.privacy.title} titleVariant="screenTitle" />}
      gap={Spacing.l}>
      <View style={styles.intro}>
        <IconContainer size={40} radius={20} backgroundColor={Alpha.white(0.7)}>
          <ShieldIcon />
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
            icon={<PhotoIcon />}
            title={t.privacy.facePhotos}
            body={t.privacy.facePhotosBody}
            bodyVariant="footnote"
            minHeight={72}
          />
          <InfoRow
            icon={<SkinProfileLargeIcon />}
            title={t.privacy.skinProfile}
            body={t.privacy.skinProfileBody}
          />
          <InfoRow
            icon={<ScanResultsIcon />}
            title={t.privacy.scanResults}
            body={t.privacy.scanResultsBody}
          />
        </ListGroup>
      </Section>

      <Section title={t.privacy.aiImprovement}>
        <View style={styles.consentCard}>
          <IconContainer size={36} radius={20} backgroundColor={Alpha.white(0.7)}>
            <ShieldIcon />
          </IconContainer>
          <View style={styles.consentCopy}>
            <AppText variant="label">{t.privacy.aiImprovementTitle}</AppText>
            <AppText variant="footnote" color={Colors.text.secondary}>
              {t.privacy.aiImprovementBody}
            </AppText>
          </View>
          <Toggle
            value={aiImprovementConsent === true}
            onValueChange={setAiImprovementConsent}
            accessibilityLabel={t.privacy.aiImprovementTitle}
          />
        </View>
      </Section>

      <Section title={t.privacy.yourControls}>
        <ListGroup>
          <ActionRow icon={<TrashIcon />} label={t.privacy.deleteHistory} onPress={deleteHistory} />
          <ActionRow
            icon={<DeleteAccountIcon />}
            label={t.privacy.deleteAccount}
            weight="semibold"
            onPress={deleteAccount}
          />
        </ListGroup>
      </Section>

      <Notice
        icon={<InfoImportantIcon />}
        tone="blush"
        title={t.privacy.noticeTitle}
        message={t.privacy.noticeBody}
        messageVariant="caption"
        style={styles.notice}
      />

      <ActionRow
        standalone
        icon={<DocumentIcon />}
        label={t.privacy.privacyPolicy}
        color={Colors.text.primary}
        weight="semibold"
        onPress={() => showMockupOnlyAlert(t, t.privacy.privacyPolicy.replace('  ›', ''))}
      />

      <AppText variant="footnote" color={Colors.text.muted} align="center">
        {t.privacy.policyNote}
      </AppText>
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
