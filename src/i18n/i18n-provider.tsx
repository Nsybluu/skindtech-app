import { createContext, useContext, useState, type ReactNode } from 'react';

import { en, type Translations } from './en';
import { th } from './th';

export type Language = 'en' | 'th';

export const SUPPORTED_LANGUAGES: readonly Language[] = ['en', 'th'];

/** Each language's own name, e.g. "ไทย" for Thai. */
export const NATIVE_LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  th: 'ไทย',
};

const translations: Record<Language, Translations> = { en, th };

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translations;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // TODO(api): persist the preference (AsyncStorage / user settings endpoint).
  const [language, setLanguage] = useState<Language>('en');

  return (
    <I18nContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside <I18nProvider>');
  }
  return context;
}
