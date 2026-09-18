import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import ChevronRightIcon from '@/assets/icons/chevron-right.svg';
import { AppText } from '@/components/ui/app-text';
import { IconContainer } from '@/components/ui/icon-container';
import { ListRow } from '@/components/ui/list-group';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';

type MenuRowProps = {
  icon: ReactNode;
  label: string;
  /** Second line under the label (e.g. "Oily skin · Sensitive"). */
  description?: string;
  /** Right-aligned value before the chevron (e.g. the current language). */
  value?: string;
  onPress: () => void;
  minHeight?: number;
  iconBackground?: string;
};

/** Row in the Profile menu: tinted icon, label, optional value, chevron. */
export function MenuRow({
  icon,
  label,
  description,
  value,
  onPress,
  minHeight = 48,
  iconBackground = Alpha.rose(0.08),
}: MenuRowProps) {
  return (
    <ListRow
      minHeight={minHeight}
      paddingVertical={Spacing.s}
      accessibilityLabel={description ? `${label}, ${description}` : label}
      onPress={onPress}>
      <IconContainer size={28} radius={Radius.l} backgroundColor={iconBackground}>
        {icon}
      </IconContainer>

      <View style={styles.copy}>
        {description ? (
          <>
            <AppText variant="titleSmall" numberOfLines={1}>
              {label}
            </AppText>
            <AppText variant="caption" color={Colors.text.muted} numberOfLines={1}>
              {description}
            </AppText>
          </>
        ) : (
          <AppText variant="body" numberOfLines={1}>
            {label}
          </AppText>
        )}
      </View>

      {value ? (
        <AppText
          variant="label"
          weight="regular"
          color={Colors.text.muted}
          numberOfLines={1}
          style={styles.value}>
          {value}
        </AppText>
      ) : null}
      <ChevronRightIcon />
    </ListRow>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
  },
  value: {
    flexShrink: 0,
  },
});
