"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MonthPicker } from "@/components/ui/monthpicker";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ProductionTableToolbarProps<TData> {
  table: Table<TData>;
  flocks: Array<{ id: string; batchCode: string; currentCount: number }>;
}

export function ProductionTableToolbar<TData>({
  table,
  flocks,
}: ProductionTableToolbarProps<TData>) {
  const t = useTranslations('production.table');
  const isFiltered = table.getState().columnFilters.length > 0;
  const [selectedMonth, setSelectedMonth] = React.useState<Date | undefined>(undefined);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);

  // Flock options for filtering
  const flockOptions = flocks.map((flock) => ({
    label: `${flock.batchCode} (${flock.currentCount} birds)`,
    value: flock.id,
  }));

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

  // Clear all filters
  const clearFilters = () => {
    table.resetColumnFilters();
    setSelectedMonth(undefined);
    setSelectedDate(undefined);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
        {/* Search Input for Flock */}
        <Input
          placeholder={t('searchPlaceholder')}
          value={(table.getColumn("flockId")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("flockId")?.setFilterValue(event.target.value)
          }
          className="h-8 w-full sm:w-[150px] lg:w-[250px]"
        />
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Month Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-8 w-full sm:w-[180px] pl-3 text-left font-normal",
                  !selectedMonth && "text-muted-foreground"
                )}
                disabled={!!selectedDate}
              >
                {selectedMonth ? (
                  format(selectedMonth, "MMM dd, yyyy")
                ) : (
                  <span>{t('filterByMonth')}</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                  "h-8 w-full sm:w-[180px] pl-3 text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
                disabled={!!selectedMonth}
              >
                {selectedDate ? (
                  format(selectedDate, "MMM dd, yyyy")
                ) : (
                  <span>{t('filterByDate')}</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Clear Filters Button */}
        {(isFiltered || selectedMonth || selectedDate) && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="h-8 px-2 lg:px-3"
          >
            {t('reset')}
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
