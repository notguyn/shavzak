"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import type { z } from "zod"

import { dir, type Locale } from "@/i18n/config"
import {
  createAssignmentAction,
  updateAssignmentAction,
  updateAssignmentGroupAction,
} from "@/modules/assignments/actions"
import {
  ASSIGNMENT_TYPES,
  PRIORITIES,
  assignmentSchema,
  type AssignmentInput,
} from "@/modules/assignments/schema"
import { previewAssignmentsStore } from "@/lib/preview/domain-stores"
import { PREVIEW_MODE } from "@/lib/preview/flag"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DateTimePicker } from "@/components/ui/datetime-picker"
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
  SelectItem,
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

type FormInput = z.input<typeof assignmentSchema>
type FormOutput = z.output<typeof assignmentSchema>

export interface AssignmentFormValue extends AssignmentInput {
  id?: string
  recurringGroupId?: string | null
}

interface Option {
  id: string
  name: string
}

export function AssignmentForm({
  open,
  onOpenChange,
  assignment,
  boards,
  certifications,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: AssignmentFormValue | null
  boards: Option[]
  certifications: Option[]
}) {
  const t = useTranslations("assignments")
  const tc = useTranslations("common")
  const tType = useTranslations("assignmentTypes")
  const tPriority = useTranslations("priority")
  const locale = useLocale() as Locale
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  const empty: AssignmentInput = React.useMemo(
    () => ({
      title: "",
      type: "MISSION",
      description: "",
      location: "",
      startAt: "",
      endAt: "",
      requiredManpower: 1,
      requiredRole: "",
      priority: "MEDIUM",
      requiresWeapon: false,
      requiresVehicle: false,
      difficultyScore: 1,
      boardId: boards[0]?.id ?? "",
      requiredCertificationIds: [],
      recurring: false,
      dayStartHour: 0,
      shiftHours: 6,
      shiftsPerDay: 4,
      manpowerPerShift: 1,
    }),
    [boards],
  )

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: empty,
  })

  React.useEffect(() => {
    if (open) form.reset(assignment ? { ...empty, ...assignment } : empty)
  }, [open, assignment, empty, form])

  function toggleCert(id: string) {
    const current = (form.getValues("requiredCertificationIds") as string[]) ?? []
    const next = current.includes(id) ? current.filter((v) => v !== id) : [...current, id]
    form.setValue("requiredCertificationIds", next as never, { shouldDirty: true })
  }

  function onSubmit(values: FormOutput) {
    if (PREVIEW_MODE) {
      const now = new Date().toISOString()
      // Recurring series aren't fully replicated client-side (no real per-instance
      // slot generation) — this creates one representative row with an
      // approximate instance count instead.
      const fields = {
        title: values.title,
        type: values.type,
        startAt: values.recurring ? now : values.startAt || now,
        endAt: values.recurring ? now : values.endAt || now,
        location: values.location ?? null,
        description: values.description ?? null,
        priority: values.priority,
        requiredManpower: values.recurring ? values.manpowerPerShift : values.requiredManpower,
        requiredRole: values.requiredRole ?? null,
        requiresWeapon: values.requiresWeapon,
        requiresVehicle: values.requiresVehicle,
        difficultyScore: values.difficultyScore,
        boardId: values.boardId,
        requiredCertificationIds: values.requiredCertificationIds,
        recurring: !!values.recurring,
        instances: values.recurring ? values.shiftsPerDay : 1,
        recurringGroupId: assignment?.recurringGroupId ?? null,
        dayStartHour: values.dayStartHour,
        shiftHours: values.shiftHours,
        shiftsPerDay: values.shiftsPerDay,
        manpowerPerShift: values.manpowerPerShift,
      }
      if (assignment?.id) {
        previewAssignmentsStore.update(assignment.id, fields)
      } else {
        previewAssignmentsStore.create({ id: crypto.randomUUID(), filled: 0, ...fields })
      }
      toast.success(tc("saved"))
      onOpenChange(false)
      return
    }
    startTransition(async () => {
      const result = assignment?.recurringGroupId
        ? await updateAssignmentGroupAction(assignment.recurringGroupId, values)
        : assignment?.id
          ? await updateAssignmentAction(assignment.id, values)
          : await createAssignmentAction(values)
      if (result.ok) {
        toast.success(tc("saved"))
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(tc("error"))
      }
    })
  }

  const watched = form.watch()
  const isEditing = !!assignment?.id
  const isSeries = !!assignment?.recurringGroupId
  const isRecurring = !!watched.recurring

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={dir[locale] === "rtl" ? "left" : "right"}
        className="w-full overflow-y-auto sm:max-w-lg"
      >
        <SheetHeader>
          <SheetTitle>{assignment?.id ? t("editAssignment") : t("addAssignment")}</SheetTitle>
          <SheetDescription>{t("subtitle")}</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 px-4 pb-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("assignmentTitle")}</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <label className="flex items-center justify-between gap-2 text-sm font-medium">
                  {t("recurringConstant")}
                  <Switch
                    checked={watched.recurring ?? false}
                    onCheckedChange={(v) => form.setValue("recurring", v, { shouldDirty: true })}
                  />
                </label>
                {isRecurring && (
                  <p className="mt-1 text-xs text-muted-foreground">{t("recurringHint")}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("type")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue>{(value) => (value ? tType(value as never) : "")}</SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ASSIGNMENT_TYPES.map((ty) => (
                          <SelectItem key={ty} value={ty}>
                            {tType(ty as never)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("priority")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue>{(value) => (value ? tPriority(value as never) : "")}</SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {tPriority(p as never)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              {!isRecurring && (
                <>
                  <FormField
                    control={form.control}
                    name="startAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("startAt")}</FormLabel>
                        <FormControl>
                          <DateTimePicker value={field.value ?? ""} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("endAt")}</FormLabel>
                        <FormControl>
                          <DateTimePicker value={field.value ?? ""} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("location")}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requiredRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("requiredRole")}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
              {!isRecurring && (
                <FormField
                  control={form.control}
                  name="requiredManpower"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("requiredManpower")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          value={(field.value as number) ?? 1}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="difficultyScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("difficultyScore")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={(field.value as number) ?? 1}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isRecurring && isSeries && (
              <p className="rounded-md bg-chart-4/10 px-3 py-2 text-xs text-chart-4">
                {t("recurringEditHint")}
              </p>
            )}

            {isRecurring && (
              <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/20 p-3">
                <FormField
                  control={form.control}
                  name="dayStartHour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("dayStartHour")}</FormLabel>
                      <Select
                        value={String(field.value ?? 0)}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue>
                              {(v: string) => `${String(field.value ?? 0).padStart(2, "0")}:00`}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={String(i)}>
                              {`${String(i).padStart(2, "0")}:00`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {(
                  [
                    ["shiftHours", t("shiftHours")],
                    ["manpowerPerShift", t("manpowerPerShift")],
                  ] as const
                ).map(([name, label]) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
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
                ))}
                <FormField
                  control={form.control}
                  name="shiftsPerDay"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>{t("shiftsPerDay")}</FormLabel>
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
                      {fieldState.error && (
                        <p className="text-sm font-medium text-destructive">
                          {fieldState.error.message === "shiftsExceed24h"
                            ? t("shiftsExceed24h")
                            : fieldState.error.message}
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="boardId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("board")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {boards.find((b) => b.id === field.value)?.name}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {boards.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} rows={2} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={watched.requiresWeapon ?? false}
                  onCheckedChange={(v) => form.setValue("requiresWeapon", v, { shouldDirty: true })}
                />
                {t("requiresWeapon")}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={watched.requiresVehicle ?? false}
                  onCheckedChange={(v) => form.setValue("requiresVehicle", v, { shouldDirty: true })}
                />
                {t("requiresVehicle")}
              </label>
            </div>

            <div className="space-y-2">
              <FormLabel>{t("requiredCertifications")}</FormLabel>
              <div className="flex flex-wrap gap-2">
                {certifications.map((c) => {
                  const active = (watched.requiredCertificationIds ?? []).includes(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCert(c.id)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background hover:bg-accent",
                      )}
                    >
                      {c.name}
                    </button>
                  )
                })}
              </div>
            </div>

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
