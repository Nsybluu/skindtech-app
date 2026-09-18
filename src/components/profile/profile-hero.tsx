import { Pressable, StyleSheet, View } from 'react-native';

import AvatarShapeIcon from '@/assets/icons/avatar-shape.svg';
import CameraIcon from '@/assets/icons/camera.svg';
import ChangePhotoIcon from '@/assets/icons/avatar-change-photo.svg';
import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
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
    <View style={styles.hero}>
      <AppText variant="screenTitle" align="center" accessibilityRole="header">
        {t.profile.title}
      </AppText>

      <View style={styles.content}>
        <View style={styles.avatar}>
          <AvatarShapeIcon style={styles.avatarShape} />
          <AppText variant="avatarLetter" color={Colors.brand.primary} align="center" style={styles.initial}>
            {user.name.charAt(0).toUpperCase()}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.profile.changePhoto}
            hitSlop={8}
            onPress={onChangePhoto}
            style={({ pressed }) => [styles.changePhoto, pressed && styles.pressed]}>
            <ChangePhotoIcon />
            <View style={styles.cameraIcon} pointerEvents="none">
              <CameraIcon />
            </View>
          </Pressable>
        </View>

        <AppText variant="titleLarge" align="center">
          {user.name}
        </AppText>
        <AppText variant="label" weight="regular" color={Colors.text.secondary} align="center">
          {user.email}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.l,
    gap: Spacing.l,
  },
  content: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  avatar: {
    width: 78,
    height: 78,
  },
  avatarShape: {
    position: 'absolute',
    left: 3,
    top: 0,
  },
  initial: {
    position: 'absolute',
    left: 3,
    top: 22,
    width: 72,
  },
  changePhoto: {
    position: 'absolute',
    left: 45,
    top: 47,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    left: 12,
    top: 10,
  },
  pressed: {
    opacity: 0.8,
  },
});
