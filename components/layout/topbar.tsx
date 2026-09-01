import { LocaleSwitcher } from "@/components/layout/locale-switcher"
import { RoleSwitcher } from "@/components/layout/role-switcher"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { PREVIEW_MODE } from "@/lib/preview/flag"
import type { Session } from "@/lib/session"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("")
}

export function Topbar({ session }: { session: Session }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
      <SidebarTrigger className="-ms-1" />
      <Separator orientation="vertical" className="h-5 data-vertical:self-auto" />
      <div className="flex flex-1 items-center justify-end gap-2">
        {PREVIEW_MODE ? (
          <Badge variant="secondary" className="gap-1.5">
            Preview Mode
          </Badge>
        ) : (
          <RoleSwitcher current={session.role} />
        )}
        <LocaleSwitcher />
        <ThemeToggle />
        <Avatar className="size-8">
          <AvatarFallback className="text-xs">{initials(session.name)}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
