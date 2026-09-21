import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { CircleDotIcon, CircleIcon } from '@/components/ui/icons';
import { ListGroup, ListRow } from '@/components/ui/list-group';
import { Alpha, Colors } from '@/constants/colors';
import { Shadows, Spacing } from '@/constants/spacing';
import {
  NATIVE_LANGUAGE_NAMES,
  SUPPORTED_LANGUAGES,
  useI18n,
  type Language,
} from '@/i18n/i18n-provider';

type LanguageSheetProps = {
  visible: boolean;
  onClose: () => void;
};

/** Figma 11 — "Modal / Choose Language". */
export function LanguageSheet({ visible, onClose }: LanguageSheetProps) {
  const { t, language, setLanguage } = useI18n();
  const [draft, setDraft] = useState<Language>(language);

  const close = () => {
    setDraft(language);
    onClose();
  };

  const apply = () => {
    setLanguage(draft);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      handleColor={Alpha.taupe(0.38)}
      style={styles.sheet}>
      <View style={styles.header}>
        <AppText variant="sheetTitle" align="center" accessibilityRole="header">
          {t.language.title}
        </AppText>
        <AppText variant="caption" color={Colors.text.muted} align="center">
          {t.language.subtitle}
        </AppText>
      </View>

      <ListGroup backgroundColor={Alpha.white(0.78)} borderColor={Alpha.taupe(0.28)}>
        {SUPPORTED_LANGUAGES.map((option) => {
          const selected = option === draft;
          return (
            <ListRow
              key={option}
              minHeight={58}
              paddingHorizontal={Spacing.l}
              paddingVertical={Spacing.m}
              backgroundColor={selected ? Alpha.blush(0.64) : undefined}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={NATIVE_LANGUAGE_NAMES[option]}
              onPress={() => setDraft(option)}>
              {selected ? (
                <AppIcon icon={CircleDotIcon} size={20} />
              ) : (
                <AppIcon icon={CircleIcon} size={20} color={Alpha.taupe(1)} />
              )}
              <AppText variant="titleSmall" style={styles.optionLabel}>
                {NATIVE_LANGUAGE_NAMES[option]}
              </AppText>
              <AppText
                variant="caption"
                color={selected ? Colors.brand.primary : Colors.text.muted}>
                {selected ? t.language.selected : t.language.names[option]}
              </AppText>
            </ListRow>
          );
        })}
      </ListGroup>

      <AppText variant="footnote" color={Colors.text.muted} align="center">
        {t.language.note}
      </AppText>

      <View style={styles.actions}>
        <AppButton
          variant="secondary"
          label={t.common.cancel}
          onPress={close}
          textVariant="button"
          style={styles.cancel}
        />
        <AppButton
          variant="solid"
          label={t.language.apply}
          onPress={apply}
          textVariant="button"
          style={styles.apply}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    boxShadow: Shadows.modalUp,
  },
  header: {
    gap: Spacing.xs,
  },
  optionLabel: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.m,
  },
  cancel: {
    width: 100,
  },
  apply: {
    flex: 1,
    backgroundColor: Colors.brand.vivid,
  },
});
