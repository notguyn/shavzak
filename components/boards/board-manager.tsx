"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Plus } from "lucide-react"

import { createBoardAction, duplicateBoardToNextWeekAction, updateBoardStatusAction } from "@/modules/boards/actions"
import { BOARD_STATUSES } from "@/modules/boards/schema"
import { previewBoardsStore } from "@/lib/preview/domain-stores"
import { PREVIEW_MODE } from "@/lib/preview/flag"
import { useEntityStore } from "@/lib/preview/store"
import type { BoardRow } from "@/components/boards/boards-table"
import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

type BoardStatus = (typeof BOARD_STATUSES)[number]

function asDateInput(iso: string) {
  return new Date(iso).toISOString().slice(0, 10)
}

export function BoardManager({
  boards: initialBoards,
  currentBoardId,
  canWrite,
}: {
  boards: BoardRow[]
  currentBoardId?: string
  canWrite: boolean
}) {
  const t = useTranslations("boards")
  const tc = useTranslations("common")
  const ts = useTranslations("boardStatus")
  const router = useRouter()
  const boards = useEntityStore(previewBoardsStore, initialBoards)
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()

  const [name, setName] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [status, setStatus] = React.useState<BoardStatus>("DRAFT")
  const latestByEndDate = React.useMemo(
    () =>
      [...boards].sort(
        (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
      )[0],
    [boards],
  )

  function createBoard() {
    if (!canWrite) return
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

  function createFromLatest() {
    if (!canWrite || !latestByEndDate) return
    if (PREVIEW_MODE) {
      const spanMs =
        new Date(latestByEndDate.endDate).getTime() - new Date(latestByEndDate.startDate).getTime()
      const nextStart = new Date(latestByEndDate.endDate)
      const nextEnd = new Date(nextStart.getTime() + spanMs)
      previewBoardsStore.create({
        id: crypto.randomUUID(),
        name: `${latestByEndDate.name} (Next)`,
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
      const result = await duplicateBoardToNextWeekAction({ sourceBoardId: latestByEndDate.id })
      if (!result.ok) {
        toast.error(tc("error"))
        return
      }
      toast.success(tc("saved"))
      router.refresh()
    })
  }

  function setBoardStatus(boardId: string, nextStatus: BoardStatus) {
    if (!canWrite) return
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" className="gap-2">
            <Plus className="size-4" />
            {t("manage")}
          </Button>
        }
      />
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{t("manage")}</SheetTitle>
          <SheetDescription>{t("subtitle")}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-4 pt-2">
          {canWrite && (
            <div className="space-y-3 rounded-lg border p-3">
              <h3 className="text-sm font-medium">{t("create")}</h3>
              <div className="space-y-2">
                <Label htmlFor="board-name">{t("name")}</Label>
                <Input id="board-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("dateRange")}</Label>
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onStartChange={setStartDate}
                  onEndChange={setEndDate}
                />
              </div>
              <div className="space-y-2">
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
              <div className="flex flex-wrap gap-2">
                <Button onClick={createBoard} disabled={pending || !name || !startDate || !endDate}>
                  {t("create")}
                </Button>
                <Button variant="secondary" onClick={createFromLatest} disabled={pending || !latestByEndDate}>
                  {t("createNextWeek")}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-medium">{t("allBoards")}</h3>
            <div className="space-y-2">
              {boards.map((b) => (
                <div key={b.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{b.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {asDateInput(b.startDate)} - {asDateInput(b.endDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {canWrite ? (
                        <Select value={b.status} onValueChange={(v) => setBoardStatus(b.id, v as BoardStatus)}>
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
                      ) : (
                        <span className="text-xs text-muted-foreground">{ts(b.status as never)}</span>
                      )}
                      <Button
                        variant={currentBoardId === b.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setOpen(false)
                          router.push(`/shavzak?board=${b.id}`)
                        }}
                      >
                        {currentBoardId === b.id ? t("current") : tc("open")}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
