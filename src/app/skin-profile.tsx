import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Alert, StyleSheet, TextInput, View, type StyleProp, type TextStyle } from 'react-native';

import { OptionChips, type ChipOption } from '@/components/profile/option-chips';
import { ActionBar } from '@/components/ui/action-bar';
import { AppButton } from '@/components/ui/app-button';
import { AppIcon } from '@/components/ui/app-icon';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { InfoIcon } from '@/components/ui/icons';
import { Notice } from '@/components/ui/notice';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { FontFamily } from '@/constants/typography';
import { useI18n } from '@/i18n/i18n-provider';
import { useUserData } from '@/providers/app-provider';
import type { SkinConcern, SkinSensitivity, SkinType } from '@/types/profile';

/** The backend rejects longer ingredient text. */
const INGREDIENTS_MAX_LENGTH = 1_000;

type Draft = {
  skinType: SkinType | null;
  sensitivity: SkinSensitivity | null;
  concerns: SkinConcern[];
  ingredients: string;
};

/** Figma 06 — Skin Profile. Required before the first scan. */
export default function SkinProfileScreen() {
  const { t } = useI18n();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { skinProfile, isSkinProfileLoading, isSavingSkinProfile, saveSkinProfile } = useUserData();

  // Until the user changes something the form simply shows the saved profile, which may
  // arrive after this screen opened. Once they edit, their draft is never overwritten.
  const saved: Draft = {
    skinType: skinProfile?.skinType ?? null,
    sensitivity: skinProfile?.sensitivity ?? null,
    concerns: skinProfile?.concerns ?? [],
    ingredients: skinProfile?.ingredientsToAvoid ?? '',
  };
  const [draft, setDraft] = useState<Draft | null>(null);
  const { skinType, sensitivity, concerns, ingredients } = draft ?? saved;
  const update = (patch: Partial<Draft>) => {
    if (isSavingSkinProfile) return;
    setDraft({ skinType, sensitivity, concerns, ingredients, ...patch });
  };

  const skinTypeRows: ChipOption<SkinType>[][] = [
    [
      { value: 'oily', label: t.skinProfile.skinTypes.oily, flex: 88 },
      { value: 'dry', label: t.skinProfile.skinTypes.dry, flex: 78 },
      { value: 'combination', label: t.skinProfile.skinTypes.combination, flex: 160 },
    ],
    [
      { value: 'normal', label: t.skinProfile.skinTypes.normal, flex: 164 },
      { value: 'notSure', label: t.skinProfile.skinTypes.notSure, flex: 170 },
    ],
  ];

  const sensitivityRows: ChipOption<SkinSensitivity>[][] = [
    [
      { value: 'sensitive', label: t.skinProfile.sensitivities.sensitive, flex: 114 },
      { value: 'notSensitive', label: t.skinProfile.sensitivities.notSensitive, flex: 130 },
      { value: 'notSure', label: t.skinProfile.sensitivities.notSure, flex: 82 },
    ],
  ];

  const concernRows: ChipOption<SkinConcern>[][] = [
    [
      { value: 'acne', label: t.skinProfile.concernOptions.acne, flex: 86 },
      { value: 'excessOil', label: t.skinProfile.concernOptions.excessOil, flex: 118 },
      { value: 'dryness', label: t.skinProfile.concernOptions.dryness, flex: 122 },
    ],
    [
      { value: 'redness', label: t.skinProfile.concernOptions.redness, flex: 164 },
      { value: 'acneMarks', label: t.skinProfile.concernOptions.acneMarks, flex: 170 },
    ],
  ];

  // Saving replaces the stored profile, so wait until the current one has loaded.
  const canSave = skinType !== null && sensitivity !== null && !isSkinProfileLoading;

  // The backend must confirm the save before anything changes: a failure keeps what the user typed.
  const save = async () => {
    if (!skinType || !sensitivity || !canSave || isSavingSkinProfile) return;

    try {
      const stored = await saveSkinProfile({
        skinType,
        sensitivity,
        concerns,
        ingredientsToAvoid: ingredients.trim(),
      });
      if (stored === null) return; // a save is already running

      if (next === 'scan') {
        router.dismissTo('/scan');
      } else {
        router.back();
      }
    } catch {
      Alert.alert(t.skinProfile.saveFailedTitle, t.skinProfile.saveFailedBody, [{ text: t.common.ok }]);
    }
  };

  return (
    <AppScreen
      keyboardAware
      gap={Spacing.l}
      header={
        <ScreenHeader
          title={t.skinProfile.title}
          accessory={<Badge label={t.skinProfile.required} height={26} minWidth={90} />}
        />
      }
      footer={
        <ActionBar bordered>
          <AppButton
            label={isSavingSkinProfile ? t.skinProfile.saving : t.skinProfile.save}
            onPress={() => void save()}
            disabled={!canSave || isSavingSkinProfile}
            textVariant="buttonLarge"
            style={styles.saveButton}
          />
        </ActionBar>
      }>
      <Notice
        icon={<AppIcon icon={InfoIcon} size={20} />}
        title={t.skinProfile.noticeTitle}
        titleVariant="bodySmall"
        titleColor={Colors.text.primary}
        message={t.skinProfile.noticeBody}
        messageVariant="caption"
        style={styles.usageNotice}
      />

      <Field label={t.skinProfile.skinType}>
        <OptionChips
          rows={skinTypeRows}
          isSelected={(value) => value === skinType}
          onPress={(value) => update({ skinType: value })}
        />
      </Field>

      <Field label={t.skinProfile.sensitivity}>
        <OptionChips
          rows={sensitivityRows}
          isSelected={(value) => value === sensitivity}
          onPress={(value) => update({ sensitivity: value })}
        />
      </Field>

      <Field label={t.skinProfile.concerns}>
        <OptionChips
          rows={concernRows}
          multiple
          isSelected={(value) => concerns.includes(value)}
          onPress={(value) =>
            update({
              concerns: concerns.includes(value)
                ? concerns.filter((concern) => concern !== value)
                : [...concerns, value],
            })
          }
        />
      </Field>

      <Field label={t.skinProfile.ingredients}>
        <TextInput
          value={ingredients}
          onChangeText={(text) => update({ ingredients: text })}
          maxLength={INGREDIENTS_MAX_LENGTH}
          placeholder={t.skinProfile.ingredientsPlaceholder}
          placeholderTextColor={Colors.text.muted}
          selectionColor={Colors.brand.primary}
          accessibilityLabel={t.skinProfile.ingredients}
          style={styles.input}
        />
      </Field>

      <Notice
        icon={<AppIcon icon={InfoIcon} size={18} />}
        message={t.skinProfile.disclaimer}
        messageVariant="caption"
        style={styles.disclaimer}
      />
    </AppScreen>
  );
}

type FieldProps = {
  label: string;
  labelStyle?: StyleProp<TextStyle>;
  children: ReactNode;
};

function Field({ label, labelStyle, children }: FieldProps) {
  return (
    <View style={styles.field}>
      <AppText variant="title" style={labelStyle}>
        {label}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.m,
  },

  usageNotice: {
    gap: Spacing.m,
    padding: Spacing.l,
    borderRadius: Radius.l,
  },
  input: {
    minHeight: 56,
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Alpha.taupe(0.3),
    backgroundColor: Colors.surface.card,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: Colors.text.primary,
  },
  disclaimer: {
    paddingVertical: Spacing.m,
    borderRadius: Radius.l,
  },
  saveButton: {
    flex: 1,
  },
});
