import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import CaptureButtonIcon from '@/assets/icons/capture-button.svg';
import FlashOffIcon from '@/assets/icons/flash-off.svg';
import UploadIcon from '@/assets/icons/upload.svg';
import { AppText } from '@/components/ui/app-text';
import { IconContainer } from '@/components/ui/icon-container';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';

type CaptureControlsProps = {
  onUpload: () => void;
  onCapture: () => void;
  flashOn: boolean;
  onToggleFlash: () => void;
};

/** Figma "Capture Controls": Upload · shutter · Flash. */
export function CaptureControls({ onUpload, onCapture, flashOn, onToggleFlash }: CaptureControlsProps) {
  const { t } = useI18n();

  return (
    <View style={styles.row}>
      <SideAction label={t.scan.upload} icon={<UploadIcon />} onPress={onUpload} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.scan.takePhoto}
        onPress={onCapture}
        style={({ pressed }) => pressed && styles.shutterPressed}>
        <CaptureButtonIcon />
      </Pressable>

      <SideAction
        label={flashOn ? t.scan.flashOn : t.scan.flashOff}
        icon={<FlashOffIcon />}
        onPress={onToggleFlash}
        selected={flashOn}
      />
    </View>
  );
}

type SideActionProps = {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  selected?: boolean;
};

function SideAction({ label, icon, onPress, selected = false }: SideActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.sideAction, pressed && styles.pressed]}>
      <IconContainer
        size={40}
        radius={Radius.l}
        backgroundColor={selected ? Alpha.rose(0.2) : Alpha.rose(0.1)}>
        {icon}
      </IconContainer>
      <AppText variant="footnote" color={Colors.text.secondary} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideAction: {
    width: 76,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  shutterPressed: {
    transform: [{ scale: 0.95 }],
  },
  pressed: {
    opacity: 0.7,
  },
});
