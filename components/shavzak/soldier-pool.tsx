"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { DraggableSoldier } from "./soldier-chip"
import type { PlannerSoldier } from "./types"

export function SoldierPool({
  soldiers,
  assignedCount,
}: {
  soldiers: PlannerSoldier[]
  assignedCount: Map<string, number>
}) {
  const t = useTranslations("shavzak")
  const tc = useTranslations("common")
  const [query, setQuery] = React.useState("")

  const filtered = soldiers.filter((s) =>
    `${s.fullName} ${s.role}`.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="flex h-full flex-col gap-3">
      <div>
        <p className="text-sm font-semibold">{t("soldierPool")}</p>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute inset-inline-start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tc("search")}
            className="ps-9"
          />
        </div>
      </div>
      <div className="grid max-h-[60vh] gap-2 overflow-y-auto pe-1">
        {filtered.map((s) => (
          <div key={s.id} className="relative">
            <DraggableSoldier soldier={s} />
            <span className="absolute inset-inline-end-2 top-2 rounded-full bg-muted px-1.5 text-[10px] text-muted-foreground">
              {assignedCount.get(s.id) ?? 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
