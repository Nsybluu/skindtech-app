import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { LanguageSheet } from '@/components/profile/language-sheet';
import { MenuRow } from '@/components/profile/menu-row';
import { ProfileHero } from '@/components/profile/profile-hero';
import { formatSkinProfileShort } from '@/components/scan/skin-profile-summary';
import { AppButton } from '@/components/ui/app-button';
import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { FaceSlightlySmilingIcon, GlobeIcon, InfoIcon, LogOutIcon, RotateCcwClockIcon, ShieldCheckIcon } from '@/components/ui/icons';
import { ListGroup } from '@/components/ui/list-group';
import { ScreenBackground } from '@/components/ui/screen-background';
import { APP_VERSION } from '@/constants/app';
import { Alpha, Colors } from '@/constants/colors';
import { Layout, Radius, Spacing } from '@/constants/spacing';
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
                    icon={<AppIcon icon={FaceSlightlySmilingIcon} size={16} />}
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
                    icon={<AppIcon icon={RotateCcwClockIcon} size={16} />}
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
              </View>
            </View>

            <View style={styles.accountActions}>
              <AppButton
                variant="outline"
                label={t.profile.signOut}
                icon={<AppIcon icon={LogOutIcon} size={18} />}
                onPress={handleSignOut}
                disabled={signingOut}
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
