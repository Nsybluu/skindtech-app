import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ListRow } from '@/components/ui/list-group';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';

type InfoRowProps = {
  icon: ReactNode;
  title: string;
  body: string;
  minHeight?: number;
};

/** Icon + title + description row used by Privacy & data and About SKINDTECH. */
export function InfoRow({ icon, title, body, minHeight = 58 }: InfoRowProps) {
  return (
    <ListRow minHeight={minHeight} paddingVertical={Spacing.s}>
      {icon}
      <View style={styles.copy}>
        <AppText variant="titleSmall">{title}</AppText>
        <AppText variant="caption" color={Colors.text.secondary}>
          {body}
        </AppText>
      </View>
    </ListRow>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
  },
});
