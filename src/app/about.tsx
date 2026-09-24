import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import LogoScanIcon from '@/assets/illustrations/logo-scan.svg';
import { ActionRow } from '@/components/info/action-row';
import { InfoRow } from '@/components/info/info-row';
import { AppIcon } from '@/components/ui/app-icon';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { IconContainer } from '@/components/ui/icon-container';
import { BubblesIcon, ChartNoAxesColumnIcon, DropletIcon, GraduationCapIcon, InfoIcon, ShieldCheckIcon } from '@/components/ui/icons';
import { ListGroup } from '@/components/ui/list-group';
import { Notice } from '@/components/ui/notice';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Section } from '@/components/ui/section';
import { APP_VERSION } from '@/constants/app';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';

/** Figma 13 — About SKINDTECH */
export default function AboutScreen() {
  const { t } = useI18n();

  return (
    <AppScreen
      header={<ScreenHeader title={t.about.title} />}
      gap={Spacing.l}>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <LogoScanIcon />
        </View>
        <AppText variant="headline" align="center">
          {t.common.brand}
        </AppText>
        <AppText variant="caption" color={Colors.brand.primary} align="center">
          {t.about.version(APP_VERSION)}
        </AppText>
        <AppText variant="caption" color={Colors.text.secondary} align="center">
          {t.about.description}
        </AppText>
      </View>

      <Section title={t.about.whatItDoes}>
        <ListGroup>
          <InfoRow icon={<AppIcon icon={ChartNoAxesColumnIcon} size={20} />} title={t.about.assessTitle} body={t.about.assessBody} />
          <InfoRow icon={<AppIcon icon={BubblesIcon} size={20} />} title={t.about.typesTitle} body={t.about.typesBody} />
          <InfoRow icon={<AppIcon icon={DropletIcon} size={20} />} title={t.about.careTitle} body={t.about.careBody} />
        </ListGroup>
      </Section>

      <Section title={t.about.projectInformation}>
        <View style={styles.projectCard}>
          <IconContainer size={40} radius={20} backgroundColor={Alpha.blush(0.9)}>
            <AppIcon icon={GraduationCapIcon} size={20} />
          </IconContainer>
          <View style={styles.projectCopy}>
            <AppText variant="titleSmall">{t.about.projectTitle}</AppText>
            <AppText variant="caption" color={Colors.text.secondary}>
              {t.about.projectProgram}
            </AppText>
            <AppText variant="caption" color={Colors.text.secondary}>
              {t.about.projectUniversity}
            </AppText>
          </View>
        </View>
      </Section>

      <Notice
        icon={<AppIcon icon={InfoIcon} size={18} />}
        tone="blush"
        title={t.about.noteTitle}
        message={t.about.noteBody}
        style={styles.notice}
      />

      <ActionRow
        standalone
        icon={<AppIcon icon={ShieldCheckIcon} size={18} />}
        label={t.about.privacyLink}
        color={Colors.text.primary}
        emphasized
        onPress={() => router.push('/privacy')}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s,
    padding: Spacing.xl,
    borderRadius: Radius.xxl,
    backgroundColor: Alpha.blush(0.78),
  },
  logo: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 27,
    backgroundColor: Colors.brand.vivid,
  },
  projectCard: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    padding: Spacing.l,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.surface.list,
  },
  projectCopy: {
    flex: 1,
  },
  notice: {
    gap: Spacing.m,
    padding: Spacing.l,
    borderRadius: Radius.l,
  },
});
