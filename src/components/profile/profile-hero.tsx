import { Pressable, View } from 'react-native';

import ChangePhotoIcon from '@/assets/illustrations/avatar-change-photo.svg';
import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { CameraIcon } from '@/components/ui/icons';
import { Colors } from '@/constants/colors';
import { useI18n } from '@/i18n/i18n-provider';
import type { User } from '@/types/profile';

type ProfileHeroProps = {
  user: User;
  onChangePhoto: () => void;
};

/** Figma "Hero / Account" — title, avatar with camera badge, name and email. */
export function ProfileHero({ user, onChangePhoto }: ProfileHeroProps) {
  const { t } = useI18n();

  return (
    <View className="gap-4 pb-4 pt-6">
      <AppText variant="screenTitle" accessibilityRole="header" className="text-center">
        {t.profile.title}
      </AppText>

      <View className="items-center gap-1">
        <View className="size-[78px]">
          <View className="absolute left-[3px] top-0 size-[72px] rounded-full border border-rose/[0.42] bg-canvas-avatar" />
          <AppText variant="avatarLetter" className="absolute left-[3px] top-[22px] w-[72px] text-center text-brand-primary">
            {user.name.charAt(0).toUpperCase()}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.profile.changePhoto}
            hitSlop={8}
            onPress={onChangePhoto}
            className="absolute left-[45px] top-[47px] size-[38px] items-center justify-center active:opacity-80">
            <ChangePhotoIcon />
            <View className="absolute left-3 top-2.5" pointerEvents="none">
              <AppIcon icon={CameraIcon} size={14} color={Colors.text.onBrand} />
            </View>
          </Pressable>
        </View>

        <AppText variant="sectionTitle" className="text-center">
          {user.name}
        </AppText>
        <AppText variant="bodySmall" className="text-center text-fg-secondary">
          {user.email}
        </AppText>
      </View>
    </View>
  );
}
