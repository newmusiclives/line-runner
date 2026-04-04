"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  translations,
  type Locale,
  type Translations,
  LOCALE_NAMES,
} from "./translations";

interface I18nContext {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof Translations) => string;
  locales: typeof LOCALE_NAMES;
}

const I18nCtx = createContext<I18nContext>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
  locales: LOCALE_NAMES,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lr-locale") as Locale;
      if (saved && translations[saved]) return saved;
    }
    return "en";
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem("lr-locale", newLocale);
    }
  }, []);

  const t = useCallback(
    (key: keyof Translations): string => {
      return translations[locale]?.[key] || translations.en[key] || key;
    },
    [locale]
  );

  return (
    <I18nCtx.Provider value={{ locale, setLocale, t, locales: LOCALE_NAMES }}>
      {children}
    </I18nCtx.Provider>
  );
}

export function useI18n() {
  return useContext(I18nCtx);
}
