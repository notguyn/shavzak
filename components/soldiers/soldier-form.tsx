"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import { dir, type Locale } from "@/i18n/config"
import { createSoldierAction, updateSoldierAction } from "@/modules/soldiers/actions"
import { RANK_GROUPS, SHIFTS, soldierSchema, type SoldierInput } from "@/modules/soldiers/schema"
import { previewSoldiersStore } from "@/lib/preview/domain-stores"
import { PREVIEW_MODE } from "@/lib/preview/flag"

type FormInput = z.input<typeof soldierSchema>
type FormOutput = z.output<typeof soldierSchema>
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

export interface SoldierFormValue extends SoldierInput {
  id?: string
}

interface Option {
  id: string
  name: string
}

interface SoldierFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  soldier: SoldierFormValue | null
  platoons: Option[]
  certifications: Option[]
}

const EMPTY: SoldierInput = {
  fullName: "",
  personalNumber: "",
  rank: "PRIVATE",
  platoonId: null,
  role: "",
  phone: "",
  homeCity: "",
  travelDistanceKm: 0,
  hasDrivingLicense: false,
  maxConsecutiveDuties: 3,
  medicalLimitations: [],
  preferredShifts: [],
  blockedShifts: [],
  certificationIds: [],
  tags: [],
  notes: "",
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background hover:bg-accent",
      )}
    >
      {children}
    </button>
  )
}

export function SoldierForm({
  open,
  onOpenChange,
  soldier,
  platoons,
  certifications,
}: SoldierFormProps) {
  const t = useTranslations("soldiers")
  const tc = useTranslations("common")
  const tRankGroup = useTranslations("rankGroups")
  const locale = useLocale() as Locale
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(soldierSchema),
    defaultValues: EMPTY,
  })

  React.useEffect(() => {
    if (open) form.reset(soldier ? { ...EMPTY, ...soldier } : EMPTY)
  }, [open, soldier, form])

  function toggle(field: "preferredShifts" | "blockedShifts" | "certificationIds", value: string) {
    const current = form.getValues(field) as string[]
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    form.setValue(field, next as never, { shouldDirty: true })
  }

  function onSubmit(values: FormOutput) {
    if (PREVIEW_MODE) {
      const row = {
        ...values,
        id: soldier?.id ?? crypto.randomUUID(),
        platoonName: platoons.find((p) => p.id === values.platoonId)?.name ?? null,
        certNames: certifications.filter((c) => values.certificationIds.includes(c.id)).map((c) => c.name),
      }
      if (soldier?.id) previewSoldiersStore.update(soldier.id, row)
      else previewSoldiersStore.create(row)
      toast.success(soldier?.id ? t("updatedToast") : t("createdToast"))
      onOpenChange(false)
      return
    }
    startTransition(async () => {
      const result = soldier?.id
        ? await updateSoldierAction(soldier.id, values)
        : await createSoldierAction(values)
      if (result.ok) {
        toast.success(soldier?.id ? t("updatedToast") : t("createdToast"))
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(tc("error"))
      }
    })
  }

  const watched = form.watch()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={dir[locale] === "rtl" ? "left" : "right"}
        className="w-full overflow-y-auto sm:max-w-lg"
      >
        <SheetHeader>
          <SheetTitle>{soldier?.id ? t("editSoldier") : t("addSoldier")}</SheetTitle>
          <SheetDescription>{t("subtitle")}</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>{t("fullName")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="personalNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("personalNumber")}</FormLabel>
                    <FormControl>
                      <Input {...field} inputMode="numeric" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("role")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rank"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("rank")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {field.value ? <RankLabel value={field.value} /> : null}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RANK_GROUPS.map((group) => (
                          <SelectGroup key={group.key}>
                            <SelectLabel>{tRankGroup(group.key as never)}</SelectLabel>
                            {group.ranks.map((r) => (
                              <SelectItem key={r} value={r}>
                                <RankLabel value={r} />
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="platoonId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("platoon")}</FormLabel>
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {platoons.find((p) => p.id === field.value)?.name}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {platoons.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("phone")}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="homeCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("homeCity")}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="travelDistanceKm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("travelDistance")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={(field.value as number) ?? 0}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxConsecutiveDuties"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("maxConsecutiveDuties")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={(field.value as number) ?? 0}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="hasDrivingLicense"
              render={({ field }) => (
                <FormItem>
                  <label className="flex items-center justify-between gap-2 text-sm font-medium">
                    {t("hasDrivingLicense")}
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                  </label>
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>{t("preferredShifts")}</FormLabel>
              <div className="flex flex-wrap gap-2">
                {SHIFTS.map((s) => (
                  <Chip
                    key={s}
                    active={(watched.preferredShifts ?? []).includes(s)}
                    onClick={() => toggle("preferredShifts", s)}
                  >
                    {shiftLabel(s)}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <FormLabel>{t("certifications")}</FormLabel>
              <div className="flex flex-wrap gap-2">
                {certifications.map((c) => (
                  <Chip
                    key={c.id}
                    active={(watched.certificationIds ?? []).includes(c.id)}
                    onClick={() => toggle("certificationIds", c.id)}
                  >
                    {c.name}
                  </Chip>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("notes")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} rows={3} />
                  </FormControl>
                </FormItem>
              )}
            />

            <SheetFooter className="flex-row justify-end gap-2 px-0">
              <SheetClose
                render={
                  <Button type="button" variant="outline">
                    {tc("cancel")}
                  </Button>
                }
              />
              <Button type="submit" disabled={pending}>
                {tc("save")}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

function RankLabel({ value }: { value: string }) {
  const t = useTranslations("ranks")
  return <>{t(value as never)}</>
}

function shiftLabel(s: string) {
  const map: Record<string, string> = {
    morning: "בוקר",
    noon: "צהריים",
    evening: "ערב",
    night: "לילה",
  }
  return map[s] ?? s
}
