import { getLocale } from "next-intl/server"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { Topbar } from "@/components/layout/topbar"
import { dir, type Locale } from "@/i18n/config"
import { getSession } from "@/lib/session"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [locale, session] = await Promise.all([getLocale() as Promise<Locale>, getSession()])
  const side = dir[locale] === "rtl" ? "right" : "left"

  return (
    <SidebarProvider>
      <AppSidebar side={side} />
      <SidebarInset>
        <Topbar session={session} />
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
