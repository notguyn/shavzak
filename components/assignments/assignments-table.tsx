"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { MoreHorizontal, Plus, Repeat } from "lucide-react"

import { deleteAssignmentAction } from "@/modules/assignments/actions"
import { previewAssignmentsStore } from "@/lib/preview/domain-stores"
import { PREVIEW_MODE } from "@/lib/preview/flag"
import { useEntityStore } from "@/lib/preview/store"
import { formatDateTime } from "@/lib/format"
import { PRIORITIES, ASSIGNMENT_TYPES } from "@/modules/assignments/schema"
import { PRIORITY_COLORS, typeColor } from "@/lib/shift-colors"
import { cn } from "@/lib/utils"
import type { Locale } from "@/i18n/config"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { DataTable } from "@/components/shared/data-table"
import {
  AssignmentForm,
  type AssignmentFormValue,
} from "@/components/assignments/assignment-form"

export interface AssignmentRow {
  id: string
  title: string
  type: (typeof ASSIGNMENT_TYPES)[number]
  startAt: string
  endAt: string
  location: string | null
  description: string | null
  priority: (typeof PRIORITIES)[number]
  requiredManpower: number
  requiredRole: string | null
  requiresWeapon: boolean
  requiresVehicle: boolean
  difficultyScore: number
  boardId: string
  requiredCertificationIds: string[]
  filled: number
  recurring: boolean
  instances: number
  recurringGroupId: string | null
  dayStartHour: number
  shiftHours: number
  shiftsPerDay: number
  manpowerPerShift: number
}

interface Option {
  id: string
  name: string
}

/** ISO -> "yyyy-MM-ddTHH:mm" in local time for datetime-local inputs. */
function toLocalInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function AssignmentsTable({
  rows: initialRows,
  boards,
  certifications,
  canWrite,
}: {
  rows: AssignmentRow[]
  boards: Option[]
  certifications: Option[]
  canWrite: boolean
}) {
  const t = useTranslations("assignments")
  const tc = useTranslations("common")
  const tType = useTranslations("assignmentTypes")
  const tPriority = useTranslations("priority")
  const locale = useLocale() as Locale
  const router = useRouter()
  const rows = useEntityStore(previewAssignmentsStore, initialRows)
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<AssignmentFormValue | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<AssignmentRow | null>(null)
  const [deleting, startDelete] = React.useTransition()

  function onAdd() {
    setEditing(null)
    setOpen(true)
  }

  function onEdit(row: AssignmentRow) {
    setEditing({
      id: row.id,
      recurringGroupId: row.recurringGroupId,
      title: row.title,
      type: row.type,
      description: row.description,
      location: row.location,
      startAt: row.recurring ? "" : toLocalInput(row.startAt),
      endAt: row.recurring ? "" : toLocalInput(row.endAt),
      requiredManpower: row.recurring ? row.manpowerPerShift : row.requiredManpower,
      requiredRole: row.requiredRole,
      priority: row.priority,
      requiresWeapon: row.requiresWeapon,
      requiresVehicle: row.requiresVehicle,
      difficultyScore: row.difficultyScore,
      boardId: row.boardId,
      requiredCertificationIds: row.requiredCertificationIds,
      recurring: row.recurring,
      dayStartHour: row.dayStartHour,
      shiftHours: row.shiftHours,
      shiftsPerDay: row.shiftsPerDay,
      manpowerPerShift: row.manpowerPerShift,
    })
    setOpen(true)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    if (PREVIEW_MODE) {
      previewAssignmentsStore.remove(deleteTarget.id)
      toast.success(tc("deleted"))
      setDeleteTarget(null)
      return
    }
    startDelete(async () => {
      const r = await deleteAssignmentAction(deleteTarget.id)
      if (r.ok) {
        toast.success(tc("deleted"))
        setDeleteTarget(null)
        router.refresh()
      } else toast.error(tc("error"))
    })
  }

  const columns: ColumnDef<AssignmentRow>[] = [
    {
      accessorKey: "title",
      header: t("assignmentTitle"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.title}</span>
          {row.original.recurring && (
            <Badge variant="secondary" className="gap-1">
              <Repeat className="size-3" />
              {t("recurringBadge")}
              <span className="tabular-nums opacity-70">×{row.original.instances}</span>
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: t("type"),
      cell: ({ row }) => (
        <Badge variant="outline" className={typeColor(row.original.type).badge}>
          {tType(row.original.type as never)}
        </Badge>
      ),
    },
    {
      accessorKey: "startAt",
      header: t("startAt"),
      cell: ({ row }) => formatDateTime(row.original.startAt, locale),
    },
    { accessorKey: "location", header: t("location"), cell: ({ row }) => row.original.location ?? "—" },
    {
      accessorKey: "priority",
      header: t("priority"),
      cell: ({ row }) => (
        <span className={cn("rounded px-1.5 py-0.5 text-xs", PRIORITY_COLORS[row.original.priority])}>
          {tPriority(row.original.priority as never)}
        </span>
      ),
    },
    {
      id: "manpower",
      header: t("requiredManpower"),
      cell: ({ row }) => (
        <span className="tabular-nums">
          {row.original.filled}/{row.original.requiredManpower}
        </span>
      ),
    },
    ...(canWrite
      ? [
          {
            id: "actions",
            cell: ({ row }) => (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" className="size-8" aria-label={tc("actions")}>
                      <MoreHorizontal className="size-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => onEdit(row.original)}>
                      {tc("edit")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleteTarget(row.original)}
                    >
                      {tc("delete")}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          } as ColumnDef<AssignmentRow>,
        ]
      : []),
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        searchKey="title"
        toolbar={
          canWrite ? (
            <Button onClick={onAdd} className="gap-2">
              <Plus className="size-4" />
              {t("addAssignment")}
            </Button>
          ) : undefined
        }
      />
      <AssignmentForm
        open={open}
        onOpenChange={setOpen}
        assignment={editing}
        boards={boards}
        certifications={certifications}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={t("deleteConfirm")}
        description={deleteTarget?.title}
        confirmLabel={tc("delete")}
        cancelLabel={tc("cancel")}
        onConfirm={confirmDelete}
        pending={deleting}
        destructive
      />
    </>
  )
}
