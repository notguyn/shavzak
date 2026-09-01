export const locales = ["he", "en"] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "he"

/** Text direction per locale. Drives `<html dir>` and all logical-property layout. */
export const dir: Record<Locale, "rtl" | "ltr"> = {
  he: "rtl",
  en: "ltr",
}

export const localeNames: Record<Locale, string> = {
  he: "עברית",
  en: "English",
}

/** Cookie that stores the active locale (v1 has no URL-segment routing). */
export const LOCALE_COOKIE = "shavzak.locale"

export function isLocale(value: string | undefined | null): value is Locale {
  return value != null && (locales as readonly string[]).includes(value)
}
