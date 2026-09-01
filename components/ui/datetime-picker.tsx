"use client"

import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { he as heDateFns } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { he as heDayPicker } from "react-day-picker/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const dateFnsLocales = { he: heDateFns } as const
const dayPickerLocales = { he: heDayPicker } as const

const DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm"

interface DateTimePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DateTimePicker({
  value,
  onChange,
  placeholder,
  className,
  disabled,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const tc = useTranslations("common")
  const locale = useLocale()
  const resolvedPlaceholder = placeholder ?? tc("pickDateTime")
  const dfLocale = dateFnsLocales[locale as keyof typeof dateFnsLocales]
  const dpLocale = dayPickerLocales[locale as keyof typeof dayPickerLocales]

  const date = React.useMemo(() => {
    if (!value) return undefined
    const parsed = parse(value, DATETIME_FORMAT, new Date())
    return isValid(parsed) ? parsed : undefined
  }, [value])

  const timeStr = date ? format(date, "HH:mm") : "00:00"

  function handleDaySelect(selected: Date | undefined) {
    if (!selected) {
      onChange?.("")
      return
    }
    const [h, m] = timeStr.split(":").map(Number)
    selected.setHours(h, m, 0, 0)
    onChange?.(format(selected, DATETIME_FORMAT))
  }

  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!date) return
    const [h, m] = e.target.value.split(":").map(Number)
    const updated = new Date(date)
    updated.setHours(h, m, 0, 0)
    onChange?.(format(updated, DATETIME_FORMAT))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-start font-normal",
              !date && "text-muted-foreground",
              className,
            )}
          >
            <CalendarIcon className="me-2 size-4" />
            {date
              ? format(date, "dd/MM/yyyy HH:mm", { locale: dfLocale })
              : resolvedPlaceholder}
          </Button>
        }
      />
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDaySelect}
          defaultMonth={date}
          locale={dpLocale}
        />
        <div className="border-t p-3">
          <Input
            type="time"
            value={timeStr}
            onChange={handleTimeChange}
            className="w-full"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
