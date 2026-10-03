import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { IconContainer } from '@/components/ui/icon-container';
import { FaceSlightlySmilingIcon } from '@/components/ui/icons';
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
    <View className="gap-3 rounded-lg bg-surface-notice p-4">
      <View className="flex-row items-start gap-3">
        <IconContainer className="size-[30px] rounded-md">
          <AppIcon icon={FaceSlightlySmilingIcon} size={16} />
        </IconContainer>
        <View className="flex-1 gap-0.5">
          <AppText variant="captionSemibold">{t.result.skinProfileUsed}</AppText>
          {snapshot ? (
            <>
              <AppText variant="caption" className="text-fg-muted">
                {`${t.skinProfileSummary.skinTypeLong[snapshot.skinType]} · ${t.skinProfileSummary.sensitivity[snapshot.sensitivity]}`}
              </AppText>
              {concerns ? (
                <AppText variant="caption" className="text-fg-muted">
                  {t.result.snapshotConcerns(concerns)}
                </AppText>
              ) : null}
              {avoid ? (
                <AppText variant="caption" numberOfLines={3} className="text-fg-muted">
                  {t.result.snapshotAvoid(avoid)}
                </AppText>
              ) : null}
            </>
          ) : (
            <AppText variant="caption" className="text-fg-muted">
              {t.result.snapshotNone}
            </AppText>
          )}
          {/* "Saved with this scan" would be untrue when nothing was saved. */}
          {snapshot ? (
            <AppText variant="footnote" className="text-fg-muted">
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
        className="min-h-8 justify-center self-end active:opacity-60">
        <AppText variant="captionSemibold" className="text-brand-primary">
          {`${t.result.currentProfile}  ›`}
        </AppText>
      </Pressable>
    </View>
  );
}
