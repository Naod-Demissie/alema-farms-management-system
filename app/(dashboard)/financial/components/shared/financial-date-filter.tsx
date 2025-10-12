"use client";

import * as React from "react";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MonthPicker } from "@/components/ui/monthpicker";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, X } from "lucide-react";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";
import { cn } from "@/lib/utils";

interface FinancialDateFilterProps<TData> {
  table: Table<TData>;
}

export function FinancialDateFilter<TData>({
  table,
}: FinancialDateFilterProps<TData>) {
  const [selectedMonth, setSelectedMonth] = React.useState<Date | undefined>(undefined);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);

  // Handle month picker change
  const handleMonthSelect = (date: Date | undefined) => {
    setSelectedMonth(date);
    // Clear specific date when month is selected
    if (date) {
      setSelectedDate(undefined);
      // Set the filter value to the selected date - the column's filterFn will handle the comparison
      table.getColumn("date")?.setFilterValue(date);
    } else {
      table.getColumn("date")?.setFilterValue(undefined);
    }
  };

  // Handle specific date picker change
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    // Clear month filter when specific date is selected
    if (date) {
      setSelectedMonth(undefined);
      // Set the filter value to the selected date - the column's filterFn will handle the comparison
      table.getColumn("date")?.setFilterValue(date);
    } else {
      table.getColumn("date")?.setFilterValue(undefined);
    }
  };

  // Clear date filters
  const clearDateFilters = () => {
    table.getColumn("date")?.setFilterValue(undefined);
    setSelectedMonth(undefined);
    setSelectedDate(undefined);
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-2">
      {/* Month Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-8 w-full sm:w-[160px] lg:w-[180px] pl-3 text-left font-normal text-xs sm:text-sm",
              !selectedMonth && "text-muted-foreground"
            )}
            disabled={!!selectedDate}
          >
            {selectedMonth ? (
              EthiopianDateFormatter.formatForForm(selectedMonth)
            ) : (
              <span className="truncate">Filter by month</span>
            )}
            <CalendarIcon className="ml-auto h-3 w-3 sm:h-4 sm:w-4 opacity-50 flex-shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <MonthPicker
            selectedMonth={selectedMonth}
            onMonthSelect={handleMonthSelect}
          />
        </PopoverContent>
      </Popover>

      {/* Specific Date Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-8 w-full sm:w-[160px] lg:w-[180px] pl-3 text-left font-normal text-xs sm:text-sm",
              !selectedDate && "text-muted-foreground"
            )}
            disabled={!!selectedMonth}
          >
            {selectedDate ? (
              EthiopianDateFormatter.formatForForm(selectedDate)
            ) : (
              <span className="truncate">Filter by date</span>
            )}
            <CalendarIcon className="ml-auto h-3 w-3 sm:h-4 sm:w-4 opacity-50 flex-shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) =>
              date > new Date() || date < new Date("1900-01-01")
            }
          />
        </PopoverContent>
      </Popover>

      {/* Clear Date Filters Button */}
      {(selectedMonth || selectedDate) && (
        <Button
          variant="ghost"
          onClick={clearDateFilters}
          className="h-8 px-2 lg:px-3 text-xs sm:text-sm whitespace-nowrap"
        >
          <span className="hidden sm:inline">Clear Date Filters</span>
          <span className="sm:hidden">Clear</span>
          <X className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      )}
    </div>
  );
}
