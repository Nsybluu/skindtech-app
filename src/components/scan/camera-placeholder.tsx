import { View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { CameraIcon } from '@/components/ui/icons';
import { Colors } from '@/constants/colors';
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
    <View className="items-center gap-4">
      <View className="size-16 items-center justify-center rounded-full bg-white/[0.1]">
        <AppIcon icon={CameraIcon} size={28} color={Colors.text.onBrand} />
      </View>
      <View className="max-w-[280px] gap-1">
        <AppText variant="cardTitle" accessibilityRole="header" className="text-center text-fg-on-brand">
          {t.scan.cameraOffTitle}
        </AppText>
        <AppText variant="caption" className="text-center text-fg-on-dark-muted">
          {canAskAgain ? t.scan.cameraOffBody : t.scan.cameraDeniedBody}
        </AppText>
      </View>
      <AppButton
        variant="solid"
        label={canAskAgain ? t.scan.allowCamera : t.scan.openSettings}
        onPress={canAskAgain ? onAllow : onOpenSettings}
        className="h-11 px-6"
      />
    </View>
  );
}
