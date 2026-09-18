import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import AboutIcon from '@/assets/icons/about.svg';
import HistoryIcon from '@/assets/icons/history.svg';
import LanguageIcon from '@/assets/icons/language.svg';
import PrivacyIcon from '@/assets/icons/privacy.svg';
import SignOutIcon from '@/assets/icons/sign-out.svg';
import SkinProfileIcon from '@/assets/icons/skin-profile.svg';
import { LanguageSheet } from '@/components/profile/language-sheet';
import { MenuRow } from '@/components/profile/menu-row';
import { ProfileHero } from '@/components/profile/profile-hero';
import { formatSkinProfileShort } from '@/components/scan/skin-profile-summary';
import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { ListGroup } from '@/components/ui/list-group';
import { ScreenBackground } from '@/components/ui/screen-background';
import { Alpha, Colors } from '@/constants/colors';
import { Layout, Radius, Spacing } from '@/constants/spacing';
import { useDesignInsets } from '@/hooks/use-design-insets';
import { NATIVE_LANGUAGE_NAMES, useI18n } from '@/i18n/i18n-provider';
import { APP_VERSION } from '@/mocks/user';
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

  const handleSignOut = async () => {
    await authService.signOut();
    signOut();
  };

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: top(48) }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <ProfileHero user={user} onChangePhoto={() => showMockupOnlyAlert(t, t.profile.changePhoto)} />
        </View>

        <View style={styles.sheet}>
          <View style={styles.sheetContent}>
            <View style={styles.sections}>
              <View style={styles.section}>
                <AppText variant="titleSmall" accessibilityRole="header">
                  {t.profile.skinAndResults}
                </AppText>
                <ListGroup
                  backgroundColor="rgba(255, 249, 247, 0.92)"
                  borderColor={Alpha.rose(0.22)}
                  dividerColor={Alpha.taupe(0.18)}>
                  <MenuRow
                    icon={<SkinProfileIcon />}
                    iconBackground={Alpha.rose(0.1)}
                    label={t.profile.mySkinProfile}
                    description={
                      skinProfile
                        ? `${t.skinProfileSummary.skinTypeLong[skinProfile.skinType]} · ${t.skinProfileSummary.sensitivity[skinProfile.sensitivity]}`
                        : formatSkinProfileShort(null, t)
                    }
                    minHeight={52}
                    onPress={() => router.push('/skin-profile')}
                  />
                  <MenuRow
                    icon={<HistoryIcon />}
                    label={t.profile.scanHistory}
                    minHeight={52}
                    onPress={() => router.push('/scan-history')}
                  />
                </ListGroup>
              </View>

              <View style={styles.section}>
                <AppText variant="titleSmall" accessibilityRole="header">
                  {t.profile.settingsAndInformation}
                </AppText>
                <ListGroup backgroundColor={Alpha.white(0.72)} borderColor={Alpha.taupe(0.25)}>
                  <MenuRow
                    icon={<LanguageIcon />}
                    label={t.profile.language}
                    value={NATIVE_LANGUAGE_NAMES[language]}
                    onPress={() => setLanguageVisible(true)}
                  />
                  <MenuRow
                    icon={<PrivacyIcon />}
                    label={t.profile.privacyAndData}
                    onPress={() => router.push('/privacy')}
                  />
                  <MenuRow
                    icon={<AboutIcon />}
                    label={t.profile.about}
                    onPress={() => router.push('/about')}
                  />
                </ListGroup>
              </View>
            </View>

            <View style={styles.accountActions}>
              <AppButton
                variant="outline"
                label={t.profile.signOut}
                icon={<SignOutIcon />}
                onPress={handleSignOut}
              />
              <AppText variant="caption" color={Colors.text.muted} align="center">
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

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.xxl,
  },
  sheet: {
    flexGrow: 1,
    paddingTop: Spacing.xl,
    paddingBottom: Layout.tabBarClearance,
    paddingHorizontal: Layout.screenPadding,
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    borderTopWidth: 1,
    borderTopColor: Alpha.taupe(0.16),
    backgroundColor: Alpha.white(0.9),
  },
  sheetContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
    justifyContent: 'space-between',
    gap: Spacing.xxl,
  },
  sections: {
    gap: Spacing.l,
  },
  section: {
    gap: Spacing.m,
  },
  accountActions: {
    gap: Spacing.m,
  },
});
