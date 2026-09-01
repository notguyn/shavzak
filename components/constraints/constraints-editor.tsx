"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { updateRuleAction } from "@/modules/constraints/actions"
import { previewConstraintRulesStore } from "@/lib/preview/domain-stores"
import { PREVIEW_MODE } from "@/lib/preview/flag"
import { useEntityStore } from "@/lib/preview/store"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

export interface RuleRow {
  id: string
  key: string
  kind: "HARD" | "SOFT"
  enabled: boolean
  weight: number
}

export function ConstraintsEditor({ rules: initialRules, canWrite }: { rules: RuleRow[]; canWrite: boolean }) {
  const t = useTranslations("constraints")
  const tLabels = useTranslations("constraintLabels")
  const tc = useTranslations("common")
  const router = useRouter()
  const rules = useEntityStore(previewConstraintRulesStore, initialRules)
  const [, startTransition] = React.useTransition()

  function patch(id: string, data: { enabled?: boolean; weight?: number }) {
    if (PREVIEW_MODE) {
      previewConstraintRulesStore.update(id, data)
      return
    }
    startTransition(async () => {
      const r = await updateRuleAction(id, data)
      if (r.ok) router.refresh()
      else toast.error(tc("error"))
    })
  }

  const groups: ("HARD" | "SOFT")[] = ["HARD", "SOFT"]

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {groups.map((kind) => (
        <Card key={kind}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {kind === "HARD" ? t("hard") : t("soft")}
              <Badge variant={kind === "HARD" ? "destructive" : "secondary"}>
                {rules.filter((r) => r.kind === kind).length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {rules
              .filter((r) => r.kind === kind)
              .map((rule) => (
                <div key={rule.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{tLabels(rule.key as never)}</p>
                    <p className="text-xs text-muted-foreground">{rule.key}</p>
                  </div>
                  {kind === "SOFT" && (
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      defaultValue={rule.weight}
                      disabled={!canWrite || !rule.enabled}
                      className="w-20"
                      aria-label={t("weight")}
                      onBlur={(e) => {
                        const weight = Number(e.target.value)
                        if (weight !== rule.weight) patch(rule.id, { weight })
                      }}
                    />
                  )}
                  <Switch
                    checked={rule.enabled}
                    disabled={!canWrite}
                    onCheckedChange={(enabled) => patch(rule.id, { enabled })}
                    aria-label={t("enabled")}
                  />
                </div>
              ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
