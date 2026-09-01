"use client"

import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"

import { localeNames, locales } from "@/i18n/config"
import { setLocale } from "@/i18n/locale-actions"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button variant={active ? "default" : "outline"} size="sm" onClick={onClick} className={cn(active && "pointer-events-none")}>
      {children}
    </Button>
  )
}

export function SettingsPanel({ currentLocale }: { currentLocale: string }) {
  const t = useTranslations("settings")
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("language")}</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          {locales.map((l) => (
            <Choice
              key={l}
              active={l === currentLocale}
              onClick={async () => {
                await setLocale(l)
                router.refresh()
              }}
            >
              {localeNames[l]}
            </Choice>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("theme")}</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Choice active={theme === "light"} onClick={() => setTheme("light")}>
            {t("themeLight")}
          </Choice>
          <Choice active={theme === "dark"} onClick={() => setTheme("dark")}>
            {t("themeDark")}
          </Choice>
          <Choice active={theme === "system"} onClick={() => setTheme("system")}>
            {t("themeSystem")}
          </Choice>
        </CardContent>
      </Card>
    </div>
  )
}
