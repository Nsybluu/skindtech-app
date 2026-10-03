import { useState } from 'react';
import { View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { CircleDotIcon, CircleIcon } from '@/components/ui/icons';
import { ListGroup, ListRow } from '@/components/ui/list-group';
import { Alpha } from '@/constants/colors';
import { Effects } from '@/constants/effects';
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
    <BottomSheet visible={visible} onClose={close} handleClassName="bg-taupe/[0.38]" style={Effects.shadowModalUp}>
      <View className="gap-1">
        <AppText variant="headline" className="text-center" accessibilityRole="header">
          {t.language.title}
        </AppText>
        <AppText variant="body" className="text-center text-fg-secondary">
          {t.language.subtitle}
        </AppText>
      </View>

      <ListGroup className="border-taupe/[0.28] bg-white/[0.78]">
        {SUPPORTED_LANGUAGES.map((option) => {
          const selected = option === draft;
          return (
            <ListRow
              key={option}
              className={selected ? 'min-h-[58px] gap-3 bg-blush/[0.64] px-4 py-3' : 'min-h-[58px] gap-3 px-4 py-3'}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={NATIVE_LANGUAGE_NAMES[option]}
              onPress={() => setDraft(option)}>
              {selected ? (
                <AppIcon icon={CircleDotIcon} size={20} />
              ) : (
                <AppIcon icon={CircleIcon} size={20} color={Alpha.taupe(1)} />
              )}
              <AppText variant="titleSmall" className="flex-1">
                {NATIVE_LANGUAGE_NAMES[option]}
              </AppText>
              <AppText variant="caption" className={selected ? 'text-brand-primary' : 'text-fg-muted'}>
                {selected ? t.language.selected : t.language.names[option]}
              </AppText>
            </ListRow>
          );
        })}
      </ListGroup>

      <AppText variant="footnote" className="text-center text-fg-muted">
        {t.language.note}
      </AppText>

      <View className="flex-row gap-3">
        <AppButton variant="secondary" label={t.common.cancel} onPress={close} className="w-[104px]" />
        <AppButton variant="solid" label={t.language.apply} onPress={apply} className="flex-1" />
      </View>
    </BottomSheet>
  );
}
