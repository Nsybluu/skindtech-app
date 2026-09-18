import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ListRow } from '@/components/ui/list-group';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import type { TextVariant } from '@/constants/typography';

type InfoRowProps = {
  icon: ReactNode;
  title: string;
  body: string;
  minHeight?: number;
  bodyVariant?: TextVariant;
};

/** Icon + title + description row used by Privacy & data and About SKINDTECH. */
export function InfoRow({ icon, title, body, minHeight = 58, bodyVariant = 'caption' }: InfoRowProps) {
  return (
    <ListRow minHeight={minHeight} paddingVertical={Spacing.s}>
      {icon}
      <View style={styles.copy}>
        <AppText variant="label">{title}</AppText>
        <AppText variant={bodyVariant} color={Colors.text.secondary}>
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
