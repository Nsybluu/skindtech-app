import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from './app-text';

/** A section title (18) above a group of cards or rows. The one place this heading is drawn. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <AppText variant="sectionTitle" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
}
