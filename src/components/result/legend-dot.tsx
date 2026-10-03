import { View } from 'react-native';

import type { AcneCategory } from '@/types/scan';
import { cn } from '@/utils/cn';

type LegendDotProps = {
  category: AcneCategory;
  /** Ring style used over the photo, matching the dashed comedonal outline. */
  outlined?: boolean;
};

/** 8pt colour marker that ties a label to a detection category. */
export function LegendDot({ category, outlined = false }: LegendDotProps) {
  return (
    <View
      className={cn(
        'size-2 rounded-full',
        category === 'inflammatory'
          ? 'bg-brand-primary'
          : outlined
            ? 'border border-brand-peach bg-peach/[0.45]'
            : 'bg-brand-peach',
      )}
    />
  );
}
