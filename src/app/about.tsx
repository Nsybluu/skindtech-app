import { router } from 'expo-router';
import { View } from 'react-native';

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
import { useI18n } from '@/i18n/i18n-provider';

/** Figma 13 — About SKINDTECH */
export default function AboutScreen() {
  const { t } = useI18n();

  return (
    <AppScreen header={<ScreenHeader title={t.about.title} />} contentClassName="gap-4">
      <View className="items-center justify-center gap-2 rounded-2xl bg-blush/[0.78] p-5">
        <View className="size-[54px] items-center justify-center rounded-full bg-brand-vivid">
          <LogoScanIcon />
        </View>
        <AppText variant="headline" className="text-center">
          {t.common.brand}
        </AppText>
        <AppText variant="caption" className="text-brand-primary text-center">
          {t.about.version(APP_VERSION)}
        </AppText>
        <AppText variant="caption" className="text-fg-secondary text-center">
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
        <View className="min-h-[88px] flex-row items-center gap-3 rounded-lg border border-line-subtle bg-surface-list p-4">
          <IconContainer className="size-10 rounded-full bg-blush/[0.9]">
            <AppIcon icon={GraduationCapIcon} size={20} />
          </IconContainer>
          <View className="flex-1">
            <AppText variant="titleSmall">{t.about.projectTitle}</AppText>
            <AppText variant="caption" className="text-fg-secondary">
              {t.about.projectProgram}
            </AppText>
            <AppText variant="caption" className="text-fg-secondary">
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
        className="p-4"
      />

      <ActionRow
        standalone
        icon={<AppIcon icon={ShieldCheckIcon} size={18} />}
        label={t.about.privacyLink}
        colorClassName="text-fg-primary"
        emphasized
        onPress={() => router.push('/privacy')}
      />
    </AppScreen>
  );
}
