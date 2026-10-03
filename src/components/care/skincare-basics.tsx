import { View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { DropletIcon, SoapDispenserDropletIcon, SunMediumIcon, type LucideIcon } from '@/components/ui/icons';
import { useI18n } from '@/i18n/i18n-provider';
import type { CareBasic } from '@/types/recommendation';

const ICONS: Record<CareBasic, LucideIcon> = {
  gentle_cleanser: SoapDispenserDropletIcon,
  lightweight_moisturizer: DropletIcon,
  non_comedogenic_spf: SunMediumIcon,
};

/** Figma "Card / Skincare Basics" — one tile per basic the recommendation names. */
export function SkincareBasics({ basics }: { basics: CareBasic[] }) {
  const { t } = useI18n();

  return (
    <View className="gap-3 rounded-lg bg-rose/[0.07] p-4">
      <AppText variant="cardTitle" accessibilityRole="header">
        {t.care.basicsTitle}
      </AppText>
      <View className="flex-row gap-2">
        {basics.map((basic) => (
          // Just enough side padding (px-0.5) for "Non-comedogenic" to stay on one line at the caption size.
          <View
            key={basic}
            className="min-h-[76px] flex-1 items-center justify-center gap-2 rounded-md bg-white/[0.68] px-0.5 py-3">
            <AppIcon icon={ICONS[basic]} size={20} />
            {/* All tiles share one size; a long label wraps instead of shrinking. */}
            <AppText variant="footnote" className="text-center text-fg-secondary">
              {t.care.basic[basic]}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}
