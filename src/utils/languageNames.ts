/**
 * Map ISO 639-1/639-2 language codes to native language names
 * Used for displaying subtitle languages in their native scripts
 */
export const LANGUAGE_NAMES: Record<string, string> = {
  // Common languages
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  ru: "Русский",
  ja: "日本語",
  ko: "한국어",
  zh: "中文",
  ar: "العربية",
  hi: "हिन्दी",
  tr: "Türkçe",
  pl: "Polski",
  nl: "Nederlands",
  sv: "Svenska",
  no: "Norsk",
  da: "Dansk",
  fi: "Suomi",
  cs: "Čeština",
  hu: "Magyar",
  ro: "Română",
  uk: "Українська",
  el: "Ελληνικά",
  he: "עברית",
  th: "ไทย",
  vi: "Tiếng Việt",
  id: "Bahasa Indonesia",
  ms: "Bahasa Melayu",
  fa: "فارسی",
  bn: "বাংলা",
  ta: "தமிழ்",
  te: "తెలుగు",
  mr: "मराठी",
  ur: "اردو",

  // Regional variants
  "en-US": "English (US)",
  "en-GB": "English (UK)",
  "es-ES": "Español (España)",
  "es-MX": "Español (México)",
  "pt-BR": "Português (Brasil)",
  "pt-PT": "Português (Portugal)",
  "zh-CN": "中文 (简体)",
  "zh-TW": "中文 (繁體)",
  "zh-HK": "中文 (香港)",
  "fr-CA": "Français (Canada)",

  // Additional languages
  bg: "Български",
  ca: "Català",
  hr: "Hrvatski",
  et: "Eesti",
  lv: "Latviešu",
  lt: "Lietuvių",
  sk: "Slovenčina",
  sl: "Slovenščina",
  sr: "Српски",
  sq: "Shqip",
  mk: "Македонски",
  is: "Íslenska",
  ga: "Gaeilge",
  cy: "Cymraeg",
  eu: "Euskara",
  gl: "Galego",
  mt: "Malti",
  af: "Afrikaans",
  sw: "Kiswahili",
  zu: "isiZulu",
  xh: "isiXhosa",
  am: "አማርኛ",
  km: "ខ្មែរ",
  lo: "ລາວ",
  my: "မြန်မာ",
  ne: "नेपाली",
  si: "සිංහල",
  kn: "ಕನ್ನಡ",
  ml: "മലയാളം",
  gu: "ગુજરાતી",
  pa: "ਪੰਜਾਬੀ",
  or: "ଓଡ଼ିଆ",
  as: "অসমীয়া",
};

/**
 * Get native language name from ISO code
 * Falls back to uppercase code if not found
 */
export function getLanguageName(code: string): string {
  const normalized = code.toLowerCase().trim();
  return LANGUAGE_NAMES[normalized] || code.toUpperCase();
}
