import type { FC } from 'react';
import { Pressable, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import MildPreviewIcon from '@/assets/illustrations/scan-preview-mild.svg';
import ModeratePreviewIcon from '@/assets/illustrations/scan-preview-moderate.svg';
import SeverePreviewIcon from '@/assets/illustrations/scan-preview-severe.svg';
import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { CheckIcon } from '@/components/ui/icons';
import { Colors } from '@/constants/colors';
import { useI18n } from '@/i18n/i18n-provider';
import type { ScanResult, Severity } from '@/types/scan';
import { cn } from '@/utils/cn';
import { formatScanDate, getDetectedCategories } from '@/utils/format';

const PREVIEW: Record<Severity, { Icon: FC<SvgProps>; backgroundClass: string; borderClass: string }> = {
  none: { Icon: MildPreviewIcon, backgroundClass: 'bg-history-mild', borderClass: 'border-taupe/[0.24]' },
  mild: { Icon: MildPreviewIcon, backgroundClass: 'bg-history-mild', borderClass: 'border-taupe/[0.24]' },
  moderate: { Icon: ModeratePreviewIcon, backgroundClass: 'bg-history-moderate', borderClass: 'border-rose/[0.2]' },
  severe: { Icon: SeverePreviewIcon, backgroundClass: 'bg-history-severe', borderClass: 'border-rose/[0.24]' },
};

type ScanHistoryCardProps = {
  result: ScanResult;
  onPress: () => void;
  /** "Manage" mode: the card is a checkbox instead of a button, with a selection circle at its end. */
  selectable?: boolean;
  selected?: boolean;
  /** The selection cannot change right now (everything is selected, or a deletion is running). */
  locked?: boolean;
};

/** Figma "Scan History Card". */
export function ScanHistoryCard({
  result,
  onPress,
  selectable = false,
  selected = false,
  locked = false,
}: ScanHistoryCardProps) {
  const { t, language } = useI18n();
  const { Icon, backgroundClass, borderClass } = PREVIEW[result.severity];
  const summary = t.result.summary(result.amount, result.severity);
  const date = formatScanDate(result.scannedAt, { language, todayLabel: t.result.today });

  return (
    <Pressable
      accessibilityRole={selectable ? 'checkbox' : 'button'}
      accessibilityLabel={selectable ? `${summary}, ${date}` : summary}
      accessibilityState={selectable ? { checked: selected, disabled: locked } : undefined}
      onPress={onPress}
      className={cn(
        // 12pt between thumbnail, text and the selection circle keeps a two-word summary on one line.
        'min-h-[120px] flex-row items-center gap-3 rounded-lg border bg-white/[0.82] p-4',
        borderClass,
        // Clear but not loud: a rose border and a faint blush fill.
        selectable && selected && 'border-rose/[0.6] bg-blush/[0.9]',
        !locked && 'active:opacity-[0.85]',
      )}>
      <View className={cn('h-[88px] w-16 items-center justify-center rounded-lg', backgroundClass)}>
        <Icon />
      </View>
      <View className="flex-1 gap-1">
        <AppText variant="caption" className="text-fg-muted">
          {date}
        </AppText>
        {/* Long Thai summaries wrap to a second line instead of being cut off. */}
        <AppText variant="cardTitle" numberOfLines={2} className="text-brand-primary">
          {summary}
        </AppText>
        <AppText variant="caption" numberOfLines={2} className="text-fg-secondary">
          {t.result.categoryList(getDetectedCategories(result))}
        </AppText>
        {selectable ? null : (
          <AppText variant="captionSemibold" className="text-brand-primary">
            {t.history.viewResult}
          </AppText>
        )}
      </View>
      {selectable ? (
        <View
          className={cn(
            'size-6 items-center justify-center rounded-full border-[1.5px]',
            selected ? 'border-brand-primary bg-brand-primary' : 'border-taupe/[0.6] bg-white/[0.9]',
          )}>
          {selected ? <AppIcon icon={CheckIcon} size={14} color={Colors.text.onBrand} strokeWidth={3} /> : null}
        </View>
      ) : null}
    </Pressable>
  );
}
