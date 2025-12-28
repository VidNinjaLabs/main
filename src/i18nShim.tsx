/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable import/no-unresolved */
import { useCallback } from "react";

import en from "@/locales/en.json";

// Flatten keys for nested objects (simple version)
function getNestedValue(obj: any, path: string): string {
  return (
    path.split(".").reduce((prev, curr) => (prev ? prev[curr] : null), obj) ||
    path
  );
}
// Mock i18n instance for compatibility
const i18n = {
  language: "en",
  changeLanguage: (lang: string) => {
    i18n.language = lang;
    return Promise.resolve();
  },
  use: () => i18n,
  init: () => Promise.resolve(),
  dir: () => "ltr", // English is always ltr
  on: () => {},
  off: () => {},
  t: (key: string, options?: any) => {
    // Basic implementation reuse
    let value = getNestedValue(en, key);
    if (options && typeof value === "string") {
      Object.keys(options).forEach((optKey) => {
        value = value.replace(
          new RegExp(`{{${optKey}}}`, "g"),
          options[optKey],
        );
      });
    }
    return value;
  },
};

export default i18n;

export function useTranslation() {
  const t = useCallback((key: string, options?: any) => {
    return i18n.t(key, options);
  }, []);

  return {
    t,
    i18n,
  };
}

export function Trans({
  i18nKey,
  children,
  className,
  values,
  components: _components, // Unused but keeping for API compatibility
}: {
  i18nKey?: string;
  children?: React.ReactNode;
  className?: string;
  values?: Record<string, any>;
  components?: any;
}) {
  // Always call the hook at the top level
  const { t } = useTranslation();

  if (i18nKey) {
    const translatedText = t(i18nKey, values);

    // Return with className if provided
    if (className) {
      return <span className={className}>{translatedText}</span>;
    }
    return <>{translatedText}</>;
  }
  return <>{children}</>;
}
