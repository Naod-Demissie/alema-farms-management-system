"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { EthiopianCalendarUtils, ETHIOPIAN_DAYS, ETHIOPIAN_MONTHS } from "@/lib/ethiopian-calendar"

interface EthiopianCalendarProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  className?: string
  month?: Date
  onMonthChange?: (month: Date) => void
}

function EthiopianCalendar({
  selected,
  onSelect,
  disabled,
  className,
  month = new Date(),
  onMonthChange,
}: EthiopianCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(month)

  // Get Ethiopian date for current month
  const currentEthiopian = EthiopianCalendarUtils.gregorianToEthiopian(currentMonth)

  // Get the first day of the Ethiopian month
  const firstDayOfMonth = EthiopianCalendarUtils.ethiopianToGregorian(
    currentEthiopian.year,
    currentEthiopian.month,
    1
  )

  // Get the last day of the Ethiopian month (30 for most months, 5/6 for Pagumen)
  const daysInMonth = EthiopianCalendarUtils.getDaysInEthiopianMonth(
    currentEthiopian.year,
    currentEthiopian.month
  )

  // Get the day of the week for the first day of the month
  const firstDayOfWeek = firstDayOfMonth.getDay()

  // Generate array of days for the current Ethiopian month
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Generate empty cells for days before the first day of the month
  const emptyCells = Array.from({ length: firstDayOfWeek }, (_, i) => i)

  const handlePreviousMonth = () => {
    const newMonth = new Date(currentMonth)
    if (currentEthiopian.month === 1) {
      // Go to previous year, month 13 (Pagumen)
      const prevYear = EthiopianCalendarUtils.ethiopianToGregorian(
        currentEthiopian.year - 1,
        13,
        1
      )
      setCurrentMonth(prevYear)
    } else {
      // Go to previous month
      const prevMonth = EthiopianCalendarUtils.ethiopianToGregorian(
        currentEthiopian.year,
        currentEthiopian.month - 1,
        1
      )
      setCurrentMonth(prevMonth)
    }
    onMonthChange?.(currentMonth)
  }

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth)
    if (currentEthiopian.month === 13) {
      // Go to next year, month 1 (Meskerem)
      const nextYear = EthiopianCalendarUtils.ethiopianToGregorian(
        currentEthiopian.year + 1,
        1,
        1
      )
      setCurrentMonth(nextYear)
    } else {
      // Go to next month
      const nextMonth = EthiopianCalendarUtils.ethiopianToGregorian(
        currentEthiopian.year,
        currentEthiopian.month + 1,
        1
      )
      setCurrentMonth(nextMonth)
    }
    onMonthChange?.(currentMonth)
  }

  const handleDayClick = (day: number) => {
    const selectedDate = EthiopianCalendarUtils.ethiopianToGregorian(
      currentEthiopian.year,
      currentEthiopian.month,
      day
    )
    onSelect?.(selectedDate)
  }

  const isDaySelected = (day: number) => {
    if (!selected) return false
    const selectedEthiopian = EthiopianCalendarUtils.gregorianToEthiopian(selected)
    return (
      selectedEthiopian.year === currentEthiopian.year &&
      selectedEthiopian.month === currentEthiopian.month &&
      selectedEthiopian.day === day
    )
  }

  const isDayDisabled = (day: number) => {
    const date = EthiopianCalendarUtils.ethiopianToGregorian(
      currentEthiopian.year,
      currentEthiopian.month,
      day
    )
    return disabled?.(date) || false
  }

  const isToday = (day: number) => {
    const today = EthiopianCalendarUtils.gregorianToEthiopian(new Date())
    return (
      today.year === currentEthiopian.year &&
      today.month === currentEthiopian.month &&
      today.day === day
    )
  }

  return (
    <div className={cn("bg-background p-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePreviousMonth}
          className="h-8 w-8"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        
        <div className="text-center">
          <div className="text-sm font-medium">
            {ETHIOPIAN_MONTHS[currentEthiopian.month - 1]} {currentEthiopian.year} ዓ.ም
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          className="h-8 w-8"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {ETHIOPIAN_DAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before the first day of the month */}
        {emptyCells.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
        
        {/* Days of the month */}
        {days.map((day) => (
          <Button
            key={day}
            variant="ghost"
            size="icon"
            onClick={() => handleDayClick(day)}
            disabled={isDayDisabled(day)}
            className={cn(
              "aspect-square h-8 w-8 text-sm font-normal",
              isDaySelected(day) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              isToday(day) && !isDaySelected(day) && "bg-accent text-accent-foreground",
              isDayDisabled(day) && "opacity-50 cursor-not-allowed"
            )}
          >
            {day}
          </Button>
        ))}
      </div>
    </div>
  )
}

export { EthiopianCalendar }
