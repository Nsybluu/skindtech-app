import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { IconContainer } from '@/components/ui/icon-container';
import { ChevronRightIcon } from '@/components/ui/icons';
import { ListRow } from '@/components/ui/list-group';
import { Colors } from '@/constants/colors';
import { cn } from '@/utils/cn';

type MenuRowProps = {
  icon: ReactNode;
  label: string;
  /** Second line under the label (e.g. "Oily skin · Sensitive"). */
  description?: string;
  /** Right-aligned value before the chevron (e.g. the current language). */
  value?: string;
  onPress: () => void;
  /** Replaces the default `min-h-12`. */
  className?: string;
  /** Background class of the icon tile; defaults to `bg-rose/[0.08]`. */
  iconClassName?: string;
};

/** Row in the Profile menu: tinted icon, label, optional value, chevron. */
export function MenuRow({
  icon,
  label,
  description,
  value,
  onPress,
  className,
  iconClassName = 'bg-rose/[0.08]',
}: MenuRowProps) {
  return (
    <ListRow
      className={cn('min-h-12', className)}
      accessibilityLabel={description ? `${label}, ${description}` : label}
      onPress={onPress}>
      <IconContainer className={cn('size-7 rounded-lg', iconClassName)}>{icon}</IconContainer>

      <View className="flex-1">
        {description ? (
          <>
            <AppText variant="titleSmall" numberOfLines={1}>
              {label}
            </AppText>
            <AppText variant="caption" numberOfLines={1} className="text-fg-muted">
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
        <AppText variant="bodySmall" numberOfLines={1} className="shrink-0 text-fg-muted">
          {value}
        </AppText>
      ) : null}
      <AppIcon icon={ChevronRightIcon} size={16} color={Colors.text.muted} />
    </ListRow>
  );
}
