"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { ArrowUpDown, MoreHorizontal, Plus } from "lucide-react"

import { deleteSoldierAction } from "@/modules/soldiers/actions"
import { previewSoldiersStore } from "@/lib/preview/domain-stores"
import { PREVIEW_MODE } from "@/lib/preview/flag"
import { useEntityStore } from "@/lib/preview/store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { DataTable } from "@/components/shared/data-table"
import { SoldierForm, type SoldierFormValue } from "@/components/soldiers/soldier-form"

export interface SoldierRow extends SoldierFormValue {
  id: string
  platoonName: string | null
  certNames: string[]
}

interface Option {
  id: string
  name: string
}

export function SoldiersTable({
  soldiers: initialSoldiers,
  platoons,
  certifications,
  canWrite,
}: {
  soldiers: SoldierRow[]
  platoons: Option[]
  certifications: Option[]
  canWrite: boolean
}) {
  const t = useTranslations("soldiers")
  const tc = useTranslations("common")
  const tRanks = useTranslations("ranks")
  const router = useRouter()
  const soldiers = useEntityStore(previewSoldiersStore, initialSoldiers)
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<SoldierFormValue | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<SoldierRow | null>(null)
  const [deleting, startDelete] = React.useTransition()

  function onAdd() {
    setEditing(null)
    setOpen(true)
  }

  function onEdit(row: SoldierRow) {
    const { platoonName: _p, certNames: _c, ...value } = row
    void _p
    void _c
    setEditing(value)
    setOpen(true)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    if (PREVIEW_MODE) {
      previewSoldiersStore.remove(deleteTarget.id)
      toast.success(tc("deleted"))
      setDeleteTarget(null)
      return
    }
    startDelete(async () => {
      const r = await deleteSoldierAction(deleteTarget.id)
      if (r.ok) {
        toast.success(tc("deleted"))
        setDeleteTarget(null)
        router.refresh()
      } else toast.error(tc("error"))
    })
  }

  const columns: ColumnDef<SoldierRow>[] = [
    {
      accessorKey: "fullName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ms-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("fullName")}
          <ArrowUpDown className="ms-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <Link href={`/soldiers/${row.original.id}`} className="font-medium hover:underline">
          {row.original.fullName}
        </Link>
      ),
    },
    { accessorKey: "personalNumber", header: t("personalNumber") },
    {
      accessorKey: "rank",
      header: t("rank"),
      cell: ({ row }) => <Badge variant="secondary">{tRanks(row.original.rank as never)}</Badge>,
    },
    {
      accessorKey: "platoonName",
      header: t("platoon"),
      cell: ({ row }) => row.original.platoonName ?? "—",
    },
    { accessorKey: "role", header: t("role") },
    {
      id: "certs",
      header: t("certifications"),
      cell: ({ row }) =>
        row.original.certNames.length ? (
          <div className="flex flex-wrap gap-1">
            {row.original.certNames.map((c) => (
              <Badge key={c} variant="outline" className="text-xs">
                {c}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
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
            <DropdownMenuItem render={<Link href={`/soldiers/${row.original.id}`} />}>
              {tc("details")}
            </DropdownMenuItem>
            {canWrite && (
              <>
                <DropdownMenuItem onClick={() => onEdit(row.original)}>{tc("edit")}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteTarget(row.original)}
                >
                  {tc("delete")}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={soldiers}
        searchKey="fullName"
        toolbar={
          canWrite ? (
            <Button onClick={onAdd} className="gap-2">
              <Plus className="size-4" />
              {t("addSoldier")}
            </Button>
          ) : undefined
        }
      />
      <SoldierForm
        open={open}
        onOpenChange={setOpen}
        soldier={editing}
        platoons={platoons}
        certifications={certifications}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={t("deleteConfirm")}
        description={deleteTarget?.fullName}
        confirmLabel={tc("delete")}
        cancelLabel={tc("cancel")}
        onConfirm={confirmDelete}
        pending={deleting}
        destructive
      />
    </>
  )
}
