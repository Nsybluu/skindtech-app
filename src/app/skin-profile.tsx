import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type StyleProp, type TextStyle } from 'react-native';

import InfoNoticeIcon from '@/assets/icons/info-notice.svg';
import InfoLargeIcon from '@/assets/icons/info-large.svg';
import { OptionChips, type ChipOption } from '@/components/profile/option-chips';
import { ActionBar } from '@/components/ui/action-bar';
import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Notice } from '@/components/ui/notice';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { FontFamily } from '@/constants/typography';
import { useI18n } from '@/i18n/i18n-provider';
import { useUserData } from '@/providers/app-provider';
import { profileService } from '@/services/profile.service';
import type { SkinConcern, SkinSensitivity, SkinType } from '@/types/profile';

/** Figma 06 — Skin Profile. Required before the first scan. */
export default function SkinProfileScreen() {
  const { t } = useI18n();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { skinProfile, setSkinProfile } = useUserData();

  const [skinType, setSkinType] = useState<SkinType | null>(skinProfile?.skinType ?? null);
  const [sensitivity, setSensitivity] = useState<SkinSensitivity | null>(
    skinProfile?.sensitivity ?? null,
  );
  const [concerns, setConcerns] = useState<SkinConcern[]>(skinProfile?.concerns ?? []);
  const [ingredients, setIngredients] = useState(skinProfile?.ingredientsToAvoid ?? '');

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

  const canSave = skinType !== null && sensitivity !== null;

  const save = async () => {
    if (!skinType || !sensitivity) return;

    const profile = await profileService.saveSkinProfile({
      skinType,
      sensitivity,
      concerns,
      ingredientsToAvoid: ingredients.trim(),
    });
    setSkinProfile(profile);

    if (next === 'scan') {
      router.dismissTo('/scan');
    } else {
      router.back();
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
            label={t.skinProfile.save}
            onPress={save}
            disabled={!canSave}
            textVariant="buttonLarge"
            style={styles.saveButton}
          />
        </ActionBar>
      }>
      <Notice
        icon={<InfoLargeIcon />}
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
          onPress={setSkinType}
        />
      </Field>

      <Field label={t.skinProfile.sensitivity}>
        <OptionChips
          rows={sensitivityRows}
          isSelected={(value) => value === sensitivity}
          onPress={setSensitivity}
        />
      </Field>

      <Field label={t.skinProfile.concerns}>
        <OptionChips
          rows={concernRows}
          multiple
          isSelected={(value) => concerns.includes(value)}
          onPress={(value) =>
            setConcerns((current) =>
              current.includes(value)
                ? current.filter((concern) => concern !== value)
                : [...current, value],
            )
          }
        />
      </Field>

      <Field label={t.skinProfile.ingredients}>
        <TextInput
          value={ingredients}
          onChangeText={setIngredients}
          placeholder={t.skinProfile.ingredientsPlaceholder}
          placeholderTextColor={Colors.text.muted}
          selectionColor={Colors.brand.primary}
          accessibilityLabel={t.skinProfile.ingredients}
          style={styles.input}
        />
      </Field>

      <Notice
        icon={<InfoNoticeIcon />}
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
