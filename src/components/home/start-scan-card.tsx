import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { Colors, Gradients } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';

type StartScanCardProps = {
  onStartScan: () => void;
};

/** Figma "Card / Start Skin Check". */
export function StartScanCard({ onStartScan }: StartScanCardProps) {
  const { t } = useI18n();

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <AppText variant="cardHeadline">{t.home.scanCardTitle}</AppText>
        <AppText variant="bodySmall" color={Colors.text.secondary}>
          {t.home.scanCardBody}
        </AppText>
        <AppButton
          label={t.home.startScan}
          onPress={onStartScan}
          height={44}
          radius={Radius.l}
          textVariant="bodyLarge"
          style={styles.button}
        />
      </View>
      <Image
        source={require('@/assets/images/face-scan-illustration.png')}
        contentFit="contain"
        style={styles.illustration}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 192,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.xl,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.border.brand,
    backgroundColor: Colors.background.base,
    experimental_backgroundImage: Gradients.scanCard,
    boxShadow: Shadows.primary,
  },
  content: {
    flex: 1,
    gap: Spacing.m,
  },
  button: {
    marginTop: Spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.xl,
  },
  illustration: {
    width: 108,
    height: 156,
  },
});
