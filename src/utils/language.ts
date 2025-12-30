// Language utilities using native Intl.DisplayNames API

export interface LocaleInfo {
  name: string;
  nativeName?: string;
  code: string;
  isRtl?: boolean;
}

// RTL languages
const RTL_LANGUAGES = new Set([
  "ar",
  "he",
  "fa",
  "ur",
  "yi",
  "ps",
  "sd",
  "ug",
  "ku",
  "dv",
]);

// Get language name from locale code using Intl.DisplayNames
export function getPrettyLanguageNameFromLocale(locale: string): string | null {
  if (!locale) return null;

  try {
    // Normalize locale (e.g., "en-US" -> "en", handle both - and _)
    const langCode = locale.split(/[-_]/)[0].toLowerCase();

    // Use Intl.DisplayNames to get the language name in English
    const displayNames = new Intl.DisplayNames(["en"], { type: "language" });
    const name = displayNames.of(langCode);

    // Intl.DisplayNames returns undefined for invalid codes, and returns the input for unknown codes
    if (name && name !== langCode) {
      return name;
    }

    // Fallback for language codes that Intl might not recognize
    return locale.toUpperCase();
  } catch {
    return locale.toUpperCase();
  }
}

// Sort language codes - prioritize English, then alphabetically by language name
export function sortLangCodes(langCodes: string[]): string[] {
  return [...langCodes].sort((a, b) => {
    // English variants first
    if (a.startsWith("en") && !b.startsWith("en")) return -1;
    if (!a.startsWith("en") && b.startsWith("en")) return 1;

    // Then sort by language name
    const nameA = getPrettyLanguageNameFromLocale(a) || a;
    const nameB = getPrettyLanguageNameFromLocale(b) || b;
    return nameA.localeCompare(nameB);
  });
}

// Get country code from locale (e.g., "en-US" -> "us")
export function getCountryCodeForLocale(locale: string): string | null {
  if (!locale) return null;

  const parts = locale.split(/[-_]/);
  if (parts.length > 1) {
    return parts[1].toLowerCase();
  }

  // Default country for language-only codes
  const defaultCountries: Record<string, string> = {
    en: "us",
    es: "es",
    fr: "fr",
    de: "de",
    pt: "br",
    it: "it",
    ja: "jp",
    ko: "kr",
    zh: "cn",
    ru: "ru",
    ar: "sa",
    hi: "in",
    tr: "tr",
    pl: "pl",
    nl: "nl",
    sv: "se",
    da: "dk",
    no: "no",
    fi: "fi",
    cs: "cz",
    el: "gr",
    he: "il",
    th: "th",
    vi: "vn",
    id: "id",
    ms: "my",
    uk: "ua",
    ro: "ro",
    hu: "hu",
    bg: "bg",
    hr: "hr",
    sk: "sk",
    sl: "si",
    fa: "ir",
  };

  const langCode = parts[0].toLowerCase();
  return defaultCountries[langCode] || null;
}

// Get full locale info
export function getLocaleInfo(locale: string): LocaleInfo | null {
  if (!locale) return null;

  const langCode = locale.split(/[-_]/)[0].toLowerCase();
  const name = getPrettyLanguageNameFromLocale(locale);

  if (!name) return null;

  // Get native name using the language itself
  let nativeName = name;
  try {
    const nativeDisplayNames = new Intl.DisplayNames([langCode], {
      type: "language",
    });
    const nativeNameResult = nativeDisplayNames.of(langCode);
    if (nativeNameResult && nativeNameResult !== langCode) {
      nativeName = nativeNameResult;
    }
  } catch {
    // If native display fails, use English name
  }

  return {
    code: locale,
    name,
    nativeName,
    isRtl: RTL_LANGUAGES.has(langCode),
  };
}

// Convert language code to TMDB format
export function getTmdbLanguageCode(language: string): string {
  if (!language) return "en-US";

  const langCode = language.split(/[-_]/)[0].toLowerCase();
  const countryCode = getCountryCodeForLocale(language);

  if (countryCode) {
    return `${langCode}-${countryCode.toUpperCase()}`;
  }

  return langCode;
}
