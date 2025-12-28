// Shim for language utils after removing heavy i18n libraries

export interface LocaleInfo {
  name: string;
  nativeName?: string;
  code: string;
  isRtl?: boolean;
}

export function getPrettyLanguageNameFromLocale(
  _locale: string,
): string | null {
  return "English";
}

export function sortLangCodes(langCodes: string[]) {
  return langCodes;
}

export function getCountryCodeForLocale(_locale: string): string | null {
  return "us";
}

export function getLocaleInfo(_locale: string): LocaleInfo | null {
  return {
    code: "en",
    name: "English",
    nativeName: "English",
    isRtl: false,
  };
}

export function getTmdbLanguageCode(_language: string): string {
  return "en-US";
}
