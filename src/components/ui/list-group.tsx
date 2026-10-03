import { Children, Fragment, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { cn } from '@/utils/cn';

type ListGroupProps = {
  children: ReactNode;
  /** Replaces the card's own `bg-*` / `border-*` classes. */
  className?: string;
  /** Replaces the divider's own `bg-*` class. */
  dividerClassName?: string;
};

/** Rounded card with hairline dividers between rows. */
export function ListGroup({ children, className, dividerClassName }: ListGroupProps) {
  const rows = Children.toArray(children);

  return (
    <View className={cn('overflow-hidden rounded-lg border border-line-subtle bg-surface-list', className)}>
      {rows.map((row, index) => (
        <Fragment key={index}>
          {index > 0 ? <View className={cn('h-px bg-line-divider', dividerClassName)} /> : null}
          {row}
        </Fragment>
      ))}
    </View>
  );
}

type ListRowProps = {
  children: ReactNode;
  onPress?: () => void;
  /** Row height and spacing (`min-h-*`, `gap-*`, `px-*`, `py-*`, `bg-*`); they replace the defaults `gap-3 px-3 py-2`. */
  className?: string;
  accessibilityLabel?: string;
  accessibilityState?: { selected?: boolean; checked?: boolean };
  accessibilityRole?: 'button' | 'radio' | 'link';
};

/** A horizontal row inside a ListGroup; pressable when `onPress` is set. */
export function ListRow({
  children,
  onPress,
  className,
  accessibilityLabel,
  accessibilityState,
  accessibilityRole = 'button',
}: ListRowProps) {
  const rowClass = cn('flex-row items-center gap-3 px-3 py-2', className);

  if (!onPress) {
    return <View className={rowClass}>{children}</View>;
  }

  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      onPress={onPress}
      className={cn(rowClass, 'active:bg-rose/[0.06]')}>
      {children}
    </Pressable>
  );
}
