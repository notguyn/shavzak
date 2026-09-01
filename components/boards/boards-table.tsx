"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { useLocale, useTranslations } from "next-intl"
import { CopyPlus, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { formatDate } from "@/lib/format"
import type { Locale } from "@/i18n/config"
import {
  createBoardAction,
  deleteBoardAction,
  duplicateBoardToNextWeekAction,
  updateBoardAction,
  updateBoardStatusAction,
} from "@/modules/boards/actions"
import { BOARD_STATUSES } from "@/modules/boards/schema"
import { previewBoardsStore } from "@/lib/preview/domain-stores"
import { PREVIEW_MODE } from "@/lib/preview/flag"
import { useEntityStore } from "@/lib/preview/store"
import { DataTable } from "@/components/shared/data-table"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type BoardStatus = (typeof BOARD_STATUSES)[number]

export interface BoardRow {
  id: string
  name: string
  status: BoardStatus
  startDate: string
  endDate: string
  assignmentsCount: number
  slotsCount: number
}

const STATUS_COLORS: Record<BoardStatus, string> = {
  DRAFT: "bg-chart-4/15 text-chart-4 border-chart-4/30",
  PUBLISHED: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  ARCHIVED: "bg-muted text-muted-foreground border-border",
}

export function BoardsTable({ rows: initialRows, canWrite }: { rows: BoardRow[]; canWrite: boolean }) {
  const t = useTranslations("boards")
  const tc = useTranslations("common")
  const ts = useTranslations("boardStatus")
  const locale = useLocale() as Locale
  const router = useRouter()
  const rows = useEntityStore(previewBoardsStore, initialRows)
  const [pending, startTransition] = React.useTransition()

  const [name, setName] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [status, setStatus] = React.useState<BoardStatus>("DRAFT")

  const [statusFilter, setStatusFilter] = React.useState<"ALL" | BoardStatus>("ALL")
  const [periodFilter, setPeriodFilter] = React.useState<"ALL" | "ACTIVE" | "UPCOMING" | "PAST">("ALL")
  const [editing, setEditing] = React.useState<BoardRow | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<BoardRow | null>(null)
  const [editName, setEditName] = React.useState("")
  const [editStartDate, setEditStartDate] = React.useState("")
  const [editEndDate, setEditEndDate] = React.useState("")
  const [editStatus, setEditStatus] = React.useState<BoardStatus>("DRAFT")

  const [now] = React.useState(() => Date.now())
  const filtered = React.useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false
      if (periodFilter === "ALL") return true
      const start = new Date(r.startDate).getTime()
      const end = new Date(r.endDate).getTime()
      if (periodFilter === "ACTIVE") return start <= now && end > now
      if (periodFilter === "UPCOMING") return start > now
      return end <= now
    })
  }, [rows, statusFilter, periodFilter, now])

  function createBoard() {
    if (PREVIEW_MODE) {
      previewBoardsStore.create({
        id: crypto.randomUUID(),
        name,
        status,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        assignmentsCount: 0,
        slotsCount: 0,
      })
      toast.success(tc("saved"))
      setName("")
      setStartDate("")
      setEndDate("")
      setStatus("DRAFT")
      return
    }
    startTransition(async () => {
      const result = await createBoardAction({ name, startDate, endDate, status })
      if (!result.ok) {
        toast.error(tc("error"))
        return
      }
      toast.success(tc("saved"))
      setName("")
      setStartDate("")
      setEndDate("")
      setStatus("DRAFT")
      router.refresh()
    })
  }

  function startEdit(board: BoardRow) {
    setEditing(board)
    setEditName(board.name)
    setEditStartDate(board.startDate.slice(0, 10))
    setEditEndDate(board.endDate.slice(0, 10))
    setEditStatus(board.status)
  }

  function saveEdit() {
    if (!editing) return
    if (PREVIEW_MODE) {
      previewBoardsStore.update(editing.id, {
        name: editName,
        startDate: new Date(editStartDate).toISOString(),
        endDate: new Date(editEndDate).toISOString(),
        status: editStatus,
      })
      toast.success(tc("saved"))
      setEditing(null)
      return
    }
    startTransition(async () => {
      const result = await updateBoardAction({
        boardId: editing.id,
        name: editName,
        startDate: editStartDate,
        endDate: editEndDate,
        status: editStatus,
      })
      if (!result.ok) {
        toast.error(tc("error"))
        return
      }
      toast.success(tc("saved"))
      setEditing(null)
      router.refresh()
    })
  }

  function duplicate(boardId: string) {
    if (PREVIEW_MODE) {
      const source = rows.find((r) => r.id === boardId)
      if (!source) return
      const spanMs = new Date(source.endDate).getTime() - new Date(source.startDate).getTime()
      const nextStart = new Date(source.endDate)
      const nextEnd = new Date(nextStart.getTime() + spanMs)
      previewBoardsStore.create({
        id: crypto.randomUUID(),
        name: `${source.name} (Next)`,
        status: "DRAFT",
        startDate: nextStart.toISOString(),
        endDate: nextEnd.toISOString(),
        assignmentsCount: 0,
        slotsCount: 0,
      })
      toast.success(tc("saved"))
      return
    }
    startTransition(async () => {
      const result = await duplicateBoardToNextWeekAction({ sourceBoardId: boardId })
      if (!result.ok) {
        toast.error(tc("error"))
        return
      }
      toast.success(tc("saved"))
      router.refresh()
    })
  }

  function setBoardStatus(boardId: string, nextStatus: BoardStatus) {
    if (PREVIEW_MODE) {
      previewBoardsStore.update(boardId, { status: nextStatus })
      toast.success(tc("saved"))
      return
    }
    startTransition(async () => {
      const result = await updateBoardStatusAction({ boardId, status: nextStatus })
      if (!result.ok) {
        toast.error(tc("error"))
        return
      }
      toast.success(tc("saved"))
      router.refresh()
    })
  }

  function confirmDelete() {
    if (!deleteTarget) return
    if (PREVIEW_MODE) {
      if (deleteTarget.assignmentsCount > 0) {
        toast.error(t("deleteBlockedNotEmpty"))
        return
      }
      previewBoardsStore.remove(deleteTarget.id)
      toast.success(tc("deleted"))
      setDeleteTarget(null)
      return
    }
    startTransition(async () => {
      const result = await deleteBoardAction({ boardId: deleteTarget.id })
      if (!result.ok) {
        toast.error(result.error === "BOARD_NOT_EMPTY" ? t("deleteBlockedNotEmpty") : tc("error"))
        return
      }
      toast.success(tc("deleted"))
      setDeleteTarget(null)
      router.refresh()
    })
  }

  const columns: ColumnDef<BoardRow>[] = [
    { accessorKey: "name", header: t("name"), cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    {
      accessorKey: "status",
      header: t("status"),
      cell: ({ row }) => (
        <Badge variant="outline" className={cn(STATUS_COLORS[row.original.status])}>
          {ts(row.original.status as never)}
        </Badge>
      ),
    },
    {
      id: "period",
      header: t("period"),
      cell: ({ row }) => `${formatDate(row.original.startDate, locale)} - ${formatDate(row.original.endDate, locale)}`,
    },
    {
      accessorKey: "assignmentsCount",
      header: t("assignmentsCount"),
      cell: ({ row }) => <span className="tabular-nums">{row.original.assignmentsCount}</span>,
    },
    {
      accessorKey: "slotsCount",
      header: t("slotsCount"),
      cell: ({ row }) => <span className="tabular-nums">{row.original.slotsCount}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {canWrite && (
            <Select value={row.original.status} onValueChange={(v) => setBoardStatus(row.original.id, v as BoardStatus)}>
              <SelectTrigger className="h-8 w-32">
                <SelectValue>{(value) => (value ? ts(value as never) : "")}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {BOARD_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {ts(s as never)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {canWrite && (
            <Button variant="outline" size="sm" className="gap-1" onClick={() => startEdit(row.original)}>
              <Pencil className="size-3.5" />
              {tc("edit")}
            </Button>
          )}
          {canWrite && (
            <Button variant="outline" size="sm" className="gap-1" onClick={() => duplicate(row.original.id)} disabled={pending}>
              <CopyPlus className="size-3.5" />
              {t("createNextWeek")}
            </Button>
          )}
          {canWrite && (
            <Button variant="destructive" size="sm" className="gap-1" onClick={() => setDeleteTarget(row.original)} disabled={pending}>
              <Trash2 className="size-3.5" />
              {tc("delete")}
            </Button>
          )}
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => router.push(`/shavzak?board=${row.original.id}`)}>
            <ExternalLink className="size-3.5" />
            {tc("open")}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {canWrite && (
        <div className="rounded-lg border bg-card p-4">
          <p className="mb-3 text-sm font-medium">{t("create")}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="sm:col-span-2 lg:col-span-2">
              <Label htmlFor="new-board-name">{t("name")}</Label>
              <Input id="new-board-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <Label>{t("dateRange")}</Label>
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartChange={setStartDate}
                onEndChange={setEndDate}
              />
            </div>
            <div>
              <Label>{t("status")}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as BoardStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(value) => (value ? ts(value as never) : "")}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {BOARD_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {ts(s as never)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-3">
            <Button onClick={createBoard} disabled={pending || !name || !startDate || !endDate} className="gap-2">
              <Plus className="size-4" />
              {t("create")}
            </Button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={filtered}
        searchKey="name"
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder={t("filterStatus")}>
                  {(value) => (value ? (value === "ALL" ? tc("all") : ts(value as never)) : t("filterStatus"))}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{tc("all")}</SelectItem>
                {BOARD_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {ts(s as never)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as typeof periodFilter)}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder={t("filterPeriod")}>
                  {(value) =>
                    value
                      ? value === "ALL"
                        ? tc("all")
                        : value === "ACTIVE"
                          ? t("periodActive")
                          : value === "UPCOMING"
                            ? t("periodUpcoming")
                            : t("periodPast")
                      : t("filterPeriod")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{tc("all")}</SelectItem>
                <SelectItem value="ACTIVE">{t("periodActive")}</SelectItem>
                <SelectItem value="UPCOMING">{t("periodUpcoming")}</SelectItem>
                <SelectItem value="PAST">{t("periodPast")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
      <Sheet open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{t("editBoard")}</SheetTitle>
            <SheetDescription>{t("editBoardHint")}</SheetDescription>
          </SheetHeader>
          <div className="grid gap-3 px-4 py-3">
            <div>
              <Label>{t("name")}</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label>{t("dateRange")}</Label>
              <DateRangePicker
                startDate={editStartDate}
                endDate={editEndDate}
                onStartChange={setEditStartDate}
                onEndChange={setEditEndDate}
              />
            </div>
            <div>
              <Label>{t("status")}</Label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as BoardStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(value) => (value ? ts(value as never) : "")}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {BOARD_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {ts(s as never)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <Button onClick={saveEdit} disabled={pending || !editName || !editStartDate || !editEndDate}>
              {tc("save")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={t("deleteConfirmTitle")}
        description={deleteTarget?.name}
        confirmLabel={tc("delete")}
        cancelLabel={tc("cancel")}
        onConfirm={confirmDelete}
        pending={pending}
        destructive
      />
    </div>
  )
}
