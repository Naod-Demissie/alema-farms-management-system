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
import { cn } from "@/lib/utils";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";
import { EthiopianCalendarUtils, ETHIOPIAN_MONTHS } from "@/lib/ethiopian-calendar";
import { DataTableFacetedFilter } from "@/components/table/data-table-faceted-filter";

interface RevenueTableToolbarProps<TData> {
  table: Table<TData>;
  sourceOptions: Array<{ label: string; value: string }>;
}

export function RevenueTableToolbar<TData>({
  table,
  sourceOptions,
}: RevenueTableToolbarProps<TData>) {
  const t = useTranslations('financial.revenue');
  const isFiltered = table.getState().columnFilters.length > 0;
  const [selectedMonth, setSelectedMonth] = React.useState<Date | undefined>(undefined);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);

  // Handle month picker change
  const handleMonthSelect = (date: Date | undefined) => {
    setSelectedMonth(date);
    // Clear specific date when month is selected
    if (date) {
      setSelectedDate(undefined);
      // Set the filter value with a flag to indicate it's a month filter
      table.getColumn("date")?.setFilterValue({ date, isMonthFilter: true });
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
      // Set the filter value with a flag to indicate it's a date filter
      table.getColumn("date")?.setFilterValue({ date, isMonthFilter: false });
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
        {/* Search Input for Description */}
        <Input
          placeholder={t('table.searchPlaceholder')}
          value={(table.getColumn("description")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("description")?.setFilterValue(event.target.value)
          }
          className="h-8 w-full sm:w-[150px] lg:w-[250px]"
        />
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Source Filter */}
          {table.getColumn("source") && (
            <DataTableFacetedFilter
              column={table.getColumn("source")}
              title={t('sources.filterTitle')}
              options={sourceOptions}
            />
          )}

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
                  (() => {
                    const ethDate = EthiopianCalendarUtils.gregorianToEthiopian(selectedMonth);
                    return `${ETHIOPIAN_MONTHS[ethDate.month - 1]} ${ethDate.year} ዓ.ም`;
                  })()
                ) : (
                  <span>{t('table.filterByMonth') || 'Filter by month'}</span>
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
                  EthiopianDateFormatter.formatForTable(selectedDate)
                ) : (
                  <span>{t('table.filterByDate') || 'Filter by date'}</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
        </div>

        {/* Clear Filters Button */}
        {(isFiltered || selectedMonth || selectedDate) && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="h-8 px-2 lg:px-3"
          >
            {t('table.reset') || 'Reset'}
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

