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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const dateFnsLocales = { he: heDateFns } as const
const dayPickerLocales = { he: heDayPicker } as const

interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  className,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const tc = useTranslations("common")
  const locale = useLocale()
  const resolvedPlaceholder = placeholder ?? tc("pickDate")
  const dfLocale = dateFnsLocales[locale as keyof typeof dateFnsLocales]
  const dpLocale = dayPickerLocales[locale as keyof typeof dayPickerLocales]

  const date = React.useMemo(() => {
    if (!value) return undefined
    const parsed = parse(value, "yyyy-MM-dd", new Date())
    return isValid(parsed) ? parsed : undefined
  }, [value])

  function handleSelect(selected: Date | undefined) {
    onChange?.(selected ? format(selected, "yyyy-MM-dd") : "")
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
              ? format(date, "dd/MM/yyyy", { locale: dfLocale })
              : resolvedPlaceholder}
          </Button>
        }
      />
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          defaultMonth={date}
          locale={dpLocale}
        />
      </PopoverContent>
    </Popover>
  )
}
