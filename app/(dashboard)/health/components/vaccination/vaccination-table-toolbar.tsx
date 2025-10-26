"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MonthPicker } from "@/components/ui/monthpicker";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";
import { EthiopianCalendarUtils, ETHIOPIAN_MONTHS } from "@/lib/ethiopian-calendar";
import { DataTableFacetedFilter } from "@/components/table/data-table-faceted-filter";

interface VaccinationTableToolbarProps<TData> {
  table: Table<TData>;
  flocks?: Array<{ id: string; batchCode: string; currentCount: number }>;
}

export function VaccinationTableToolbar<TData>({
  table,
  flocks = [],
}: VaccinationTableToolbarProps<TData>) {
  const t = useTranslations('health.vaccination');
  const isFiltered = table.getState().columnFilters.length > 0;
  const [selectedMonth, setSelectedMonth] = React.useState<Date | undefined>(undefined);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);

  // Flock options for filtering
  const flockOptions = flocks.map((flock) => ({
    label: `${flock.batchCode}`,
    value: flock.id,
  }));

  // Status options for filtering
  const statusOptions = [
    {
      label: t('status.scheduled', 'Scheduled'),
      value: "scheduled",
    },
    {
      label: t('status.completed', 'Completed'),
      value: "completed",
    },
  ];

  // Administration method options for filtering
  const methodOptions = [
    {
      label: t('administrationMethods.INJECTION', 'Injection'),
      value: "INJECTION",
    },
    {
      label: t('administrationMethods.DRINKING_WATER', 'Drinking Water'),
      value: "DRINKING_WATER",
    },
    {
      label: t('administrationMethods.SPRAY', 'Spray'),
      value: "SPRAY",
    },
    {
      label: t('administrationMethods.OTHER', 'Other'),
      value: "OTHER",
    },
  ];

  // Handle month picker change
  const handleMonthSelect = (date: Date | undefined) => {
    setSelectedMonth(date);
    // Clear specific date when month is selected
    if (date) {
      setSelectedDate(undefined);
      // Set the filter value with a flag to indicate it's a month filter
      table.getColumn("administeredDate")?.setFilterValue({ date, isMonthFilter: true });
    } else {
      table.getColumn("administeredDate")?.setFilterValue(undefined);
    }
  };

  // Handle specific date picker change
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    // Clear month filter when specific date is selected
    if (date) {
      setSelectedMonth(undefined);
      // Set the filter value with a flag to indicate it's a date filter
      table.getColumn("administeredDate")?.setFilterValue({ date, isMonthFilter: false });
    } else {
      table.getColumn("administeredDate")?.setFilterValue(undefined);
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
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Flock Filter */}
          {table.getColumn("flockId") && (
            <DataTableFacetedFilter
              column={table.getColumn("flockId")}
              title={t('flock', 'Flock')}
              options={flockOptions}
            />
          )}

          {/* Status Filter */}
          {table.getColumn("status") && (
            <DataTableFacetedFilter
              column={table.getColumn("status")}
              title={t('columns.status', 'Status')}
              options={statusOptions}
            />
          )}

          {/* Administration Method Filter */}
          {table.getColumn("administrationMethod") && (
            <DataTableFacetedFilter
              column={table.getColumn("administrationMethod")}
              title={t('administrationMethod', 'Method')}
              options={methodOptions}
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
                  <span>{t('filterByMonth', 'Filter by Month')}</span>
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
                  <span>{t('filterByDate', 'Filter by Date')}</span>
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
            {t('clearFilters', 'Reset')}
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

