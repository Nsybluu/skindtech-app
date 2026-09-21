import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { CameraIcon } from '@/components/ui/icons';
import { Alpha, Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';

type CameraPlaceholderProps = {
  /** False once the user has denied access: the only way back is the system Settings. */
  canAskAgain: boolean;
  onAllow: () => void;
  onOpenSettings: () => void;
};

/** Empty state for the Scan preview while the camera is not available. */
export function CameraPlaceholder({ canAskAgain, onAllow, onOpenSettings }: CameraPlaceholderProps) {
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <AppIcon icon={CameraIcon} size={28} color={Colors.text.onBrand} />
      </View>
      <View style={styles.text}>
        <AppText variant="title" color={Colors.text.onBrand} align="center" accessibilityRole="header">
          {t.scan.cameraOffTitle}
        </AppText>
        <AppText variant="caption" color={Colors.text.onDarkMuted} align="center">
          {canAskAgain ? t.scan.cameraOffBody : t.scan.cameraDeniedBody}
        </AppText>
      </View>
      <AppButton
        variant="solid"
        height={44}
        label={canAskAgain ? t.scan.allowCamera : t.scan.openSettings}
        onPress={canAskAgain ? onAllow : onOpenSettings}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.l,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Alpha.white(0.1),
  },
  text: {
    maxWidth: 280,
    gap: Spacing.xs,
  },
  button: {
    paddingHorizontal: Spacing.xxl,
  },
});
