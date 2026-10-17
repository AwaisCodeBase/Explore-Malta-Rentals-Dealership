import type { AppLocale } from "./routing";

export type TextDirection = "ltr" | "rtl";

export type LocaleMeta = {
  code: AppLocale;
  label: string;
  nativeLabel: string;
  shortLabel: string;
  direction: TextDirection;
};

export const localeMetadata: Record<AppLocale, LocaleMeta> = {
  en: {
    code: "en",
    label: "English",
    nativeLabel: "English",
    shortLabel: "EN",
    direction: "ltr",
  },
  mt: {
    code: "mt",
    label: "Maltese",
    nativeLabel: "Malti",
    shortLabel: "MT",
    direction: "ltr",
  },
  es: {
    code: "es",
    label: "Spanish",
    nativeLabel: "Español",
    shortLabel: "ES",
    direction: "ltr",
  },
  de: {
    code: "de",
    label: "German",
    nativeLabel: "Deutsch",
    shortLabel: "DE",
    direction: "ltr",
  },
  ko: {
    code: "ko",
    label: "Korean",
    nativeLabel: "한국어",
    shortLabel: "KO",
    direction: "ltr",
  },
  tr: {
    code: "tr",
    label: "Turkish",
    nativeLabel: "Türkçe",
    shortLabel: "TR",
    direction: "ltr",
  },
  it: {
    code: "it",
    label: "Italian",
    nativeLabel: "Italiano",
    shortLabel: "IT",
    direction: "ltr",
  },
  vi: {
    code: "vi",
    label: "Vietnamese",
    nativeLabel: "Tiếng Việt",
    shortLabel: "VI",
    direction: "ltr",
  },
  id: {
    code: "id",
    label: "Indonesian",
    nativeLabel: "Bahasa Indonesia",
    shortLabel: "ID",
    direction: "ltr",
  },
  th: {
    code: "th",
    label: "Thai",
    nativeLabel: "ไทย",
    shortLabel: "TH",
    direction: "ltr",
  },
  pl: {
    code: "pl",
    label: "Polish",
    nativeLabel: "Polski",
    shortLabel: "PL",
    direction: "ltr",
  },
  nl: {
    code: "nl",
    label: "Dutch",
    nativeLabel: "Nederlands",
    shortLabel: "NL",
    direction: "ltr",
  },
  bn: {
    code: "bn",
    label: "Bengali",
    nativeLabel: "বাংলা",
    shortLabel: "BN",
    direction: "ltr",
  },
  ur: {
    code: "ur",
    label: "Urdu",
    nativeLabel: "اردو",
    shortLabel: "UR",
    direction: "rtl",
  },
  zh: {
    code: "zh",
    label: "Chinese",
    nativeLabel: "中文",
    shortLabel: "ZH",
    direction: "ltr",
  },
  hi: {
    code: "hi",
    label: "Hindi",
    nativeLabel: "हिन्दी",
    shortLabel: "HI",
    direction: "ltr",
  },
  ar: {
    code: "ar",
    label: "Arabic",
    nativeLabel: "العربية",
    shortLabel: "AR",
    direction: "rtl",
  },
  fr: {
    code: "fr",
    label: "French",
    nativeLabel: "Français",
    shortLabel: "FR",
    direction: "ltr",
  },
  pt: {
    code: "pt",
    label: "Portuguese",
    nativeLabel: "Português",
    shortLabel: "PT",
    direction: "ltr",
  },
  ru: {
    code: "ru",
    label: "Russian",
    nativeLabel: "Русский",
    shortLabel: "RU",
    direction: "ltr",
  },
  ja: {
    code: "ja",
    label: "Japanese",
    nativeLabel: "日本語",
    shortLabel: "JA",
    direction: "ltr",
  },
};

export const localeList = Object.values(localeMetadata);

export function getLocaleDirection(locale: string): TextDirection {
  const meta = localeMetadata[locale as AppLocale];
  return meta?.direction ?? "ltr";
}

/** Prefer Malta-relevant / high-traffic locales in the pill row. */
const LOCALE_PILL_PRIORITY: readonly AppLocale[] = [
  "en",
  "mt",
  "it",
  "de",
  "fr",
  "es",
  "nl",
  "pl",
  "pt",
  "ru",
  "ar",
  "zh",
  "ja",
  "ko",
  "tr",
  "hi",
  "th",
  "vi",
  "id",
  "bn",
  "ur",
] as const;

/**
 * Locales shown as quick pills. Current locale is always first; remaining
 * slots follow {@link LOCALE_PILL_PRIORITY}, then any leftover locale.
 */
export function getVisibleLocaleButtons(
  current: AppLocale,
  limit = 2,
): AppLocale[] {
  const max = Math.max(1, Math.min(limit, localeList.length));
  const result: AppLocale[] = [];
  const add = (code: AppLocale) => {
    if (result.includes(code) || result.length >= max) return;
    if (!(code in localeMetadata)) return;
    result.push(code);
  };

  add(current);
  for (const code of LOCALE_PILL_PRIORITY) {
    add(code);
  }
  for (const { code } of localeList) {
    add(code);
  }
  return result;
}
