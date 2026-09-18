import type { Language } from '@/i18n/i18n-provider';
import type { GreetingPeriod } from '@/i18n/en';
import type { AcneCategory, AcneLesionType, ScanResult } from '@/types/scan';

const MONTHS: Record<Language, readonly string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  th: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
};

/** Thai dates use the Buddhist Era. */
const BUDDHIST_ERA_OFFSET = 543;

const pad = (value: number) => value.toString().padStart(2, '0');

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

type FormatScanDateOptions = {
  language: Language;
  todayLabel: string;
  /** Show "Today · 14:32" for scans made today (Home, Scan result). */
  relative?: boolean;
};

/** "02 Aug 2026 · 14:32" / "Today · 14:32" / "02 ส.ค. 2569 · 14:32" */
export function formatScanDate(iso: string, { language, todayLabel, relative = false }: FormatScanDateOptions) {
  const date = new Date(iso);
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  if (relative && isSameDay(date, new Date())) {
    return `${todayLabel} · ${time}`;
  }

  const year = date.getFullYear() + (language === 'th' ? BUDDHIST_ERA_OFFSET : 0);
  return `${pad(date.getDate())} ${MONTHS[language][date.getMonth()]} ${year} · ${time}`;
}

export function getGreetingPeriod(date = new Date()): GreetingPeriod {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

const LESION_CATEGORY: Record<AcneLesionType, AcneCategory> = {
  comedone: 'comedonal',
  papule: 'inflammatory',
  pustule: 'inflammatory',
  nodule: 'inflammatory',
};

const CATEGORY_ORDER: readonly AcneCategory[] = ['comedonal', 'inflammatory'];

/** Acne categories present in a result, in display order. */
export function getDetectedCategories(result: ScanResult): AcneCategory[] {
  const present = new Set(result.detectedTypes.map((detected) => LESION_CATEGORY[detected.type]));
  return CATEGORY_ORDER.filter((category) => present.has(category));
}
