import type { Locale } from "@/i18n/config"

const intlLocale: Record<Locale, string> = {
  he: "he-IL",
  en: "en-US",
}

export function formatDate(date: Date | string, locale: Locale, opts?: Intl.DateTimeFormatOptions) {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat(intlLocale[locale], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...opts,
  }).format(d)
}

export function formatTime(date: Date | string, locale: Locale) {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat(intlLocale[locale], {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

export function formatDateTime(date: Date | string, locale: Locale) {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat(intlLocale[locale], {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

export function formatNumber(value: number, locale: Locale, opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(intlLocale[locale], opts).format(value)
}

export function formatPercent(value: number, locale: Locale) {
  return new Intl.NumberFormat(intlLocale[locale], {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value)
}
