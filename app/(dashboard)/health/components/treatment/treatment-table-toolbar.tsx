"use client";

import React from "react";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataTableFacetedFilter } from "@/components/table/data-table-faceted-filter";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { MonthPicker } from "@/components/ui/monthpicker";
import { EthiopianCalendarUtils, ETHIOPIAN_MONTHS } from "@/lib/ethiopian-calendar";

interface TreatmentTableToolbarProps<TData> {
  table: Table<TData>;
  flocks?: Array<{ id: string; batchCode: string; currentCount: number }>;
}

export function TreatmentTableToolbar<TData>({
  table,
  flocks = [],
}: TreatmentTableToolbarProps<TData>) {
  const t = useTranslations('health.treatment.table');
  const tColumns = useTranslations('health.treatment.columns');
  const tDiseaseTypes = useTranslations('health.treatment.diseaseTypes');
  const isFiltered = table.getState().columnFilters.length > 0;
  const [selectedMonth, setSelectedMonth] = React.useState<Date | undefined>(undefined);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);

  // Flock options for filtering
  const flockOptions = flocks.map((flock) => ({
    label: `${flock.batchCode}`,
    value: flock.id,
  }));
  
  // Disease type options for filtering
  const diseaseOptions = [
    { label: tDiseaseTypes('respiratory'), value: "respiratory" },
    { label: tDiseaseTypes('digestive'), value: "digestive" },
    { label: tDiseaseTypes('parasitic'), value: "parasitic" },
    { label: tDiseaseTypes('nutritional'), value: "nutritional" },
    { label: tDiseaseTypes('other'), value: "other" },
  ];

  // Handle month picker change
  const handleMonthSelect = (date: Date | undefined) => {
    setSelectedMonth(date);
    // Clear specific date when month is selected
    if (date) {
      setSelectedDate(undefined);
      // Set the filter value with a flag to indicate it's a month filter
      table.getColumn("startDate")?.setFilterValue({ date, isMonthFilter: true });
    } else {
      table.getColumn("startDate")?.setFilterValue(undefined);
    }
  };

  // Handle specific date picker change
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    // Clear month filter when specific date is selected
    if (date) {
      setSelectedMonth(undefined);
      // Set the filter value with a flag to indicate it's a date filter
      table.getColumn("startDate")?.setFilterValue({ date, isMonthFilter: false });
    } else {
      table.getColumn("startDate")?.setFilterValue(undefined);
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
              title={tColumns('flockId')}
              options={flockOptions}
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
                  EthiopianCalendarUtils.formatEthiopianDate(selectedDate)
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
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Disease Type Filter */}
          {table.getColumn("disease") && (
            <DataTableFacetedFilter
              column={table.getColumn("disease")}
              title={tColumns('disease')}
              options={diseaseOptions}
            />
          )}
        </div>

        {/* Clear Filters */}
        {(isFiltered || selectedMonth || selectedDate) && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="h-8 px-2 lg:px-3"
          >
            {t('clearFilters')}
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
