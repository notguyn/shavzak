"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { ChevronDown, UserCog } from "lucide-react"

import { setRole } from "@/lib/session-actions"
import { ROLES, type AppRole } from "@/lib/rbac"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function RoleSwitcher({ current }: { current: AppRole }) {
  const t = useTranslations("roles")
  const tSettings = useTranslations("settings")
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function change(role: AppRole) {
    startTransition(async () => {
      await setRole(role)
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" disabled={pending} className="gap-2">
            <UserCog className="size-4" />
            <span className="hidden sm:inline">{t(current)}</span>
            <ChevronDown className="size-3.5 opacity-60" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{tSettings("role")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {ROLES.map((role) => (
            <DropdownMenuItem
              key={role}
              onClick={() => change(role)}
              data-active={role === current}
              className="data-[active=true]:font-semibold"
            >
              {t(role)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
