"use client"

import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { he as heDateFns } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { type DateRange } from "react-day-picker"
import { he as heDayPicker } from "react-day-picker/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const dateFnsLocales = { he: heDateFns } as const
const dayPickerLocales = { he: heDayPicker } as const

const DATE_FORMAT = "yyyy-MM-dd"
const DISPLAY_FORMAT = "dd/MM/yyyy"

interface DateRangePickerProps {
  startDate?: string
  endDate?: string
  onStartChange?: (value: string) => void
  onEndChange?: (value: string) => void
  className?: string
  disabled?: boolean
}

function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined
  const parsed = parse(value, DATE_FORMAT, new Date())
  return isValid(parsed) ? parsed : undefined
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  className,
  disabled,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const tc = useTranslations("common")
  const locale = useLocale()
  const dfLocale = dateFnsLocales[locale as keyof typeof dateFnsLocales]
  const dpLocale = dayPickerLocales[locale as keyof typeof dayPickerLocales]

  const range: DateRange | undefined = React.useMemo(() => {
    const from = parseDate(startDate)
    const to = parseDate(endDate)
    if (!from && !to) return undefined
    return { from, to }
  }, [startDate, endDate])

  function handleSelect(selected: DateRange | undefined) {
    onStartChange?.(
      selected?.from ? format(selected.from, DATE_FORMAT) : "",
    )
    onEndChange?.(
      selected?.to ? format(selected.to, DATE_FORMAT) : "",
    )
  }

  const label = React.useMemo(() => {
    if (range?.from && range?.to) {
      return `${format(range.from, DISPLAY_FORMAT, { locale: dfLocale })} – ${format(range.to, DISPLAY_FORMAT, { locale: dfLocale })}`
    }
    if (range?.from) {
      return format(range.from, DISPLAY_FORMAT, { locale: dfLocale })
    }
    return tc("pickDateRange")
  }, [range, dfLocale, tc])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-start font-normal",
              !range?.from && "text-muted-foreground",
              className,
            )}
          >
            <CalendarIcon className="me-2 size-4" />
            {label}
          </Button>
        }
      />
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="range"
          selected={range}
          onSelect={handleSelect}
          defaultMonth={range?.from}
          numberOfMonths={2}
          locale={dpLocale}
        />
      </PopoverContent>
    </Popover>
  )
}
