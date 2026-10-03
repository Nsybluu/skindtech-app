import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ListRow } from '@/components/ui/list-group';
import { cn } from '@/utils/cn';

type InfoRowProps = {
  icon: ReactNode;
  title: string;
  body: string;
  /** Replaces the default `min-h-[58px]`. */
  className?: string;
};

/** Icon + title + description row used by Privacy & data and About SKINDTECH. */
export function InfoRow({ icon, title, body, className }: InfoRowProps) {
  return (
    <ListRow className={cn('min-h-[58px]', className)}>
      {icon}
      <View className="flex-1">
        <AppText variant="titleSmall">{title}</AppText>
        <AppText variant="caption" className="text-fg-secondary">
          {body}
        </AppText>
      </View>
    </ListRow>
  );
}
