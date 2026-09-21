import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { IconContainer } from '@/components/ui/icon-container';
import { FaceSlightlySmilingIcon } from '@/components/ui/icons';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';
import { useUserData } from '@/providers/app-provider';
import { getDetectedCategories } from '@/utils/format';

/**
 * Figma "Card / Current Skin Context" — shows which data the assistant is using.
 * Reads the mock scan history and Skin Profile, so it reflects the real state.
 */
export function SkinContextCard() {
  const { t } = useI18n();
  const { scanHistory, skinProfile } = useUserData();
  const latestScan = scanHistory[0];

  const scanLine = latestScan
    ? t.aiChat.contextScan(
        t.result.severityValue[latestScan.severity],
        t.result.categoryList(getDetectedCategories(latestScan)),
      )
    : t.aiChat.contextScanEmpty;

  const profileLine = skinProfile
    ? t.aiChat.contextProfile(
        t.skinProfileSummary.skinTypeShort[skinProfile.skinType],
        t.skinProfileSummary.sensitivity[skinProfile.sensitivity],
      )
    : t.aiChat.contextProfileEmpty;

  return (
    <View style={styles.card}>
      <IconContainer size={40} radius={Radius.m} backgroundColor={Alpha.peach(0.24)}>
        <AppIcon icon={FaceSlightlySmilingIcon} size={18} />
      </IconContainer>
      <View style={styles.copy}>
        <AppText variant="captionSemibold">{t.aiChat.contextTitle}</AppText>
        <AppText variant="caption" color={Colors.text.muted} numberOfLines={2}>
          {scanLine}
        </AppText>
        <AppText variant="caption" color={Colors.text.muted} numberOfLines={2}>
          {profileLine}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    padding: Spacing.m,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Colors.border.brand,
    backgroundColor: Colors.surface.cardStrong,
  },
  copy: {
    flex: 1,
  },
});
