import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { LanguageSheet } from '@/components/profile/language-sheet';
import { MenuRow } from '@/components/profile/menu-row';
import { ProfileHero } from '@/components/profile/profile-hero';
import { formatSkinProfileShort } from '@/components/scan/skin-profile-summary';
import { AppButton } from '@/components/ui/app-button';
import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { FaceSlightlySmilingIcon, GlobeIcon, InfoIcon, LogOutIcon, RotateCcwClockIcon, ShieldCheckIcon } from '@/components/ui/icons';
import { ListGroup } from '@/components/ui/list-group';
import { Section } from '@/components/ui/section';
import { ScreenBackground } from '@/components/ui/screen-background';
import { APP_VERSION } from '@/constants/app';
import { useDesignInsets } from '@/hooks/use-design-insets';
import { NATIVE_LANGUAGE_NAMES, useI18n } from '@/i18n/i18n-provider';

import { useSession, useUserData } from '@/providers/app-provider';
import { authService } from '@/services/auth.service';
import { showMockupOnlyAlert } from '@/utils/alerts';

/** Figma 05 — Profile */
export default function AccountScreen() {
  const { t, language } = useI18n();
  const { signOut } = useSession();
  const { user, skinProfile } = useUserData();
  const { top } = useDesignInsets();
  const [languageVisible, setLanguageVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await authService.signOut();
    } finally {
      signOut();
      setSigningOut(false);
    }
  };

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerClassName="grow"
        // The top padding follows the status bar (runtime value).
        contentContainerStyle={{ paddingTop: top(48) }}
        showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-6">
          <ProfileHero user={user} onChangePhoto={() => showMockupOnlyAlert(t, t.profile.changePhoto)} />
        </View>

        <View className="grow rounded-t-sheet border-t border-t-taupe/[0.16] bg-white/[0.9] px-5 pb-28 pt-5">
          <View className="w-full max-w-content grow justify-between gap-6 self-center">
            <View className="gap-4">
              <Section title={t.profile.skinAndResults}>
                <ListGroup
                  className="border-rose/[0.22] bg-[rgba(255,249,247,0.92)]"
                  dividerClassName="bg-taupe/[0.18]">
                  <MenuRow
                    icon={<AppIcon icon={FaceSlightlySmilingIcon} size={16} />}
                    iconClassName="bg-rose/[0.1]"
                    label={t.profile.mySkinProfile}
                    description={
                      skinProfile
                        ? `${t.skinProfileSummary.skinTypeLong[skinProfile.skinType]} · ${t.skinProfileSummary.sensitivity[skinProfile.sensitivity]}`
                        : formatSkinProfileShort(null, t)
                    }
                    className="min-h-[52px]"
                    onPress={() => router.push('/skin-profile')}
                  />
                  <MenuRow
                    icon={<AppIcon icon={RotateCcwClockIcon} size={16} />}
                    label={t.profile.scanHistory}
                    className="min-h-[52px]"
                    onPress={() => router.push('/scan-history')}
                  />
                </ListGroup>
              </Section>

              <Section title={t.profile.settingsAndInformation}>
                <ListGroup className="border-taupe/[0.25] bg-white/[0.72]">
                  <MenuRow
                    icon={<AppIcon icon={GlobeIcon} size={16} />}
                    label={t.profile.language}
                    value={NATIVE_LANGUAGE_NAMES[language]}
                    onPress={() => setLanguageVisible(true)}
                  />
                  <MenuRow
                    icon={<AppIcon icon={ShieldCheckIcon} size={16} />}
                    label={t.profile.privacyAndData}
                    onPress={() => router.push('/privacy')}
                  />
                  <MenuRow
                    icon={<AppIcon icon={InfoIcon} size={16} />}
                    label={t.profile.about}
                    onPress={() => router.push('/about')}
                  />
                </ListGroup>
              </Section>
            </View>

            <View className="gap-3">
              <AppButton
                variant="outline"
                label={t.profile.signOut}
                icon={<AppIcon icon={LogOutIcon} size={18} />}
                onPress={handleSignOut}
                disabled={signingOut}
              />
              <AppText variant="caption" className="text-center text-fg-muted">
                {t.profile.version(APP_VERSION)}
              </AppText>
            </View>
          </View>
        </View>
      </ScrollView>

      <LanguageSheet visible={languageVisible} onClose={() => setLanguageVisible(false)} />
    </ScreenBackground>
  );
}
