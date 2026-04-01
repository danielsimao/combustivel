'use client';

import { createContext, useContext, useCallback, ReactNode } from 'react';
import pt from './translations/pt.json';
import en from './translations/en.json';

type Translations = typeof pt;
type Locale = 'pt' | 'en';

const translations: Record<Locale, Translations> = { pt, en };

interface I18nContextType {
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'pt',
  t: (key) => key,
});

function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'pt';
  const lang = navigator.language?.toLowerCase() ?? '';
  if (lang.startsWith('pt')) return 'pt';
  return 'en';
}

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' ? current : undefined;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = detectLocale();

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      let value =
        getNestedValue(translations[locale] as unknown as Record<string, unknown>, key) ??
        getNestedValue(translations.pt as unknown as Record<string, unknown>, key) ??
        key;

      if (params) {
        for (const [k, v] of Object.entries(params)) {
          value = value.replace(`{${k}}`, String(v));
        }
      }

      return value;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
