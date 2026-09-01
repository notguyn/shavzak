import { getTranslations } from "next-intl/server"

import { LocaleSwitcher } from "@/components/layout/locale-switcher"
import { ThemeToggle } from "@/components/layout/theme-toggle"

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("app")

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            {t("name").charAt(0)}
          </div>
          <span className="font-heading text-sm font-semibold">{t("name")}</span>
        </div>
        <div className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center p-4 pb-16">{children}</main>
    </div>
  )
}
