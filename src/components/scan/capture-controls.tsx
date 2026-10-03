import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import CaptureButtonIcon from '@/assets/illustrations/capture-button.svg';
import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { IconContainer } from '@/components/ui/icon-container';
import { ImageUpIcon, ZapOffIcon } from '@/components/ui/icons';
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
    <View className="min-h-[84px] flex-row items-center justify-between">
      <SideAction label={t.scan.upload} icon={<AppIcon icon={ImageUpIcon} size={18} />} onPress={onUpload} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.scan.takePhoto}
        onPress={onCapture}
        className="active:scale-95">
        <CaptureButtonIcon />
      </Pressable>

      <SideAction
        label={flashOn ? t.scan.flashOn : t.scan.flashOff}
        icon={<AppIcon icon={ZapOffIcon} size={18} />}
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
      className="min-h-16 w-[76px] items-center justify-center gap-1 active:opacity-70">
      <IconContainer className={selected ? 'size-10 rounded-lg bg-rose/[0.2]' : 'size-10 rounded-lg bg-rose/[0.1]'}>
        {icon}
      </IconContainer>
      <AppText variant="caption" numberOfLines={1} className="text-fg-secondary">
        {label}
      </AppText>
    </Pressable>
  );
}
