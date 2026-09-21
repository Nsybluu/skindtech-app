import { StyleSheet, View } from 'react-native';

import { Alpha, Colors } from '@/constants/colors';
import type { AcneCategory } from '@/types/scan';

type LegendDotProps = {
  category: AcneCategory;
  /** Ring style used over the photo, matching the dashed comedonal outline. */
  outlined?: boolean;
};

/** 8pt colour marker that ties a label to a detection category. */
export function LegendDot({ category, outlined = false }: LegendDotProps) {
  if (category === 'inflammatory') return <View style={[styles.dot, styles.inflammatory]} />;
  return <View style={[styles.dot, outlined ? styles.comedonalOutlined : styles.comedonal]} />;
}

const styles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inflammatory: {
    backgroundColor: Colors.brand.primary,
  },
  comedonal: {
    backgroundColor: Colors.brand.peach,
  },
  comedonalOutlined: {
    borderWidth: 1,
    borderColor: Colors.brand.peach,
    backgroundColor: Alpha.peach(0.45),
  },
});
