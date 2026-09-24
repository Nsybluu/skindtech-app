import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';

type StateCardProps = {
  /** Shows a spinner instead of `icon`. */
  loading?: boolean;
  icon?: ReactNode;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** A loading / "couldn't load" / empty block with an optional retry button. */
export function StateCard({ loading = false, icon, title, body, actionLabel, onAction, style }: StateCardProps) {
  return (
    <View
      accessibilityRole={loading ? 'progressbar' : undefined}
      accessibilityLiveRegion="polite"
      style={[styles.card, style]}>
      {loading ? <ActivityIndicator color={Colors.brand.primary} /> : icon}
      <AppText variant="titleSmall" align="center">
        {title}
      </AppText>
      {body ? (
        <AppText variant="caption" color={Colors.text.secondary} align="center">
          {body}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <AppButton variant="secondary" label={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: Spacing.s,
    padding: Spacing.xl,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Alpha.white(0.7),
  },
  action: {
    alignSelf: 'stretch',
    marginTop: Spacing.xs,
  },
});
