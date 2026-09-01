import { Assistant, Geist_Mono } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getLocale } from "next-intl/server"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { dir, type Locale } from "@/i18n/config"
import { cn } from "@/lib/utils"

const fontSans = Assistant({
  subsets: ["latin", "hebrew"],
  variable: "--font-sans",
})

const fontHeading = Assistant({
  subsets: ["latin", "hebrew"],
  variable: "--font-heading",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = (await getLocale()) as Locale

  return (
    <html
      lang={locale}
      dir={dir[locale]}
      suppressHydrationWarning
      className={cn(
        "antialiased font-sans",
        fontSans.variable,
        fontHeading.variable,
        fontMono.variable,
      )}
    >
      <body>
        <NextIntlClientProvider>
          <ThemeProvider>
            {children}
            <Toaster richColors position={dir[locale] === "rtl" ? "bottom-left" : "bottom-right"} />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
