"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { EthiopianCalendar } from "@/components/ui/ethiopian-calendar"
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  className?: string
  month?: Date
  onMonthChange?: (month: Date) => void
}

function Calendar({
  selected,
  onSelect,
  disabled,
  className,
  month,
  onMonthChange,
}: CalendarProps) {
  return (
    <EthiopianCalendar
      selected={selected}
      onSelect={onSelect}
      disabled={disabled}
      className={className}
      month={month}
      onMonthChange={onMonthChange}
    />
  )
}

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  placeholder?: string
  className?: string
}

function DatePicker({
  date,
  onDateChange,
  disabled,
  placeholder = "Select date",
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? EthiopianDateFormatter.formatForTable(date) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          selected={date}
          onSelect={(selectedDate) => {
            onDateChange?.(selectedDate)
            setOpen(false)
          }}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  )
}

export { Calendar, DatePicker }