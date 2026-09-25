import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { IconContainer } from '@/components/ui/icon-container';
import { FaceSlightlySmilingIcon } from '@/components/ui/icons';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';
import type { SkinProfile } from '@/types/profile';

/**
 * The Skin Profile that was used for THIS scan, exactly as the backend stored it with the scan.
 * It is deliberately not connected to the user's current profile: editing that profile later never
 * changes this card, and `null` (no profile was saved) is said in words instead of being filled in
 * with today's profile. The link to the current profile is worded as such.
 */
export function SkinProfileSnapshotCard({ snapshot }: { snapshot: SkinProfile | null }) {
  const { t } = useI18n();

  const concerns = snapshot?.concerns.map((concern) => t.skinProfile.concernOptions[concern]).join(', ') ?? '';
  const avoid = snapshot?.ingredientsToAvoid.trim() ?? '';

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <IconContainer size={30} radius={Radius.m}>
          <AppIcon icon={FaceSlightlySmilingIcon} size={16} />
        </IconContainer>
        <View style={styles.copy}>
          <AppText variant="captionSemibold">{t.result.skinProfileUsed}</AppText>
          {snapshot ? (
            <>
              <AppText variant="caption" color={Colors.text.muted}>
                {`${t.skinProfileSummary.skinTypeLong[snapshot.skinType]} · ${t.skinProfileSummary.sensitivity[snapshot.sensitivity]}`}
              </AppText>
              {concerns ? (
                <AppText variant="caption" color={Colors.text.muted}>
                  {t.result.snapshotConcerns(concerns)}
                </AppText>
              ) : null}
              {avoid ? (
                <AppText variant="caption" color={Colors.text.muted} numberOfLines={3}>
                  {t.result.snapshotAvoid(avoid)}
                </AppText>
              ) : null}
            </>
          ) : (
            <AppText variant="caption" color={Colors.text.muted}>
              {t.result.snapshotNone}
            </AppText>
          )}
          {/* "Saved with this scan" would be untrue when nothing was saved. */}
          {snapshot ? (
            <AppText variant="footnote" color={Colors.text.muted}>
              {t.result.snapshotNote}
            </AppText>
          ) : null}
        </View>
      </View>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={t.result.currentProfile}
        accessibilityHint={t.result.currentProfileHint}
        hitSlop={8}
        onPress={() => router.push('/skin-profile')}
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
        <AppText variant="captionSemibold" color={Colors.brand.primary}>
          {`${t.result.currentProfile}  ›`}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.m,
    padding: Spacing.l,
    borderRadius: Radius.l,
    backgroundColor: Colors.surface.notice,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.m,
  },
  copy: {
    flex: 1,
    gap: Spacing.xxs,
  },
  action: {
    minHeight: 32,
    alignSelf: 'flex-end',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
