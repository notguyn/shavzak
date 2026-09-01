import { cookies } from "next/headers"
import { getRequestConfig } from "next-intl/server"

import { defaultLocale, isLocale, LOCALE_COOKIE } from "./config"

/**
 * next-intl request config. Locale comes from a cookie (no locale-based routing in v1);
 * the locale switcher writes that cookie. Messages load from the dictionary per locale.
 */
export default getRequestConfig(async () => {
  const store = await cookies()
  const cookieLocale = store.get(LOCALE_COOKIE)?.value
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
