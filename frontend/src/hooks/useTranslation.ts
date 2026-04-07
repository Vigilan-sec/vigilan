import { useLanguage } from "@/contexts/LanguageContext";
import translations, { type TranslationKey } from "@/lib/i18n/translations";

export function useTranslation() {
  const { lang } = useLanguage();

  function t(key: TranslationKey, vars?: Record<string, string | number>): string {
    const dict = translations[lang];
    let str = (dict as Record<string, string>)[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(`{${k}}`, String(v));
      }
    }
    return str;
  }

  return { t, lang };
}
