"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "@/components/table/data-table-faceted-filter";
import { DataTableViewOptions } from "@/components/table/data-table-view-options";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { MonthPicker } from "@/components/ui/monthpicker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PayrollRecord } from "./payroll-table-columns";
import { useState, useEffect } from "react";

interface PayrollTableToolbarProps {
  table: Table<PayrollRecord>;
  staffList: Array<{ id: string; name: string; role: string }>;
  onMonthFilterChange?: (month: string) => void;
  onYearFilterChange?: (year: string) => void;
}

export function PayrollTableToolbar({
  table,
  staffList,
  onMonthFilterChange,
  onYearFilterChange,
}: PayrollTableToolbarProps) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(undefined);

  // Staff member options for filtering
  const staffOptions = staffList.map((staff) => ({
    label: `${staff.name} (${staff.role})`,
    value: staff.id,
  }));

  // Handle month picker change
  const handleMonthSelect = (date: Date | undefined) => {
    setSelectedMonth(date);
    if (date) {
      // Set the filter value to the selected date - the column's filterFn will handle the comparison
      table.getColumn("paidOn")?.setFilterValue(date);
      onMonthFilterChange?.(date.getMonth().toString());
      onYearFilterChange?.(date.getFullYear().toString());
    } else {
      table.getColumn("paidOn")?.setFilterValue(undefined);
      onMonthFilterChange?.("all");
      onYearFilterChange?.("all");
    }
  };

  // Clear all filters
  const clearFilters = () => {
    table.resetColumnFilters();
    setSelectedMonth(undefined);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
        {/* Search Input */}
        <Input
          placeholder="Filter by staff member..."
          value={(table.getColumn("staffName")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("staffName")?.setFilterValue(event.target.value)
          }
          className="h-8 w-full sm:w-[150px] lg:w-[250px]"
        />
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Month/Year Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-8 w-full sm:w-[180px] pl-3 text-left font-normal",
                  !selectedMonth && "text-muted-foreground"
                )}
              >
                {selectedMonth ? (
                  format(selectedMonth, "MMMM yyyy")
                ) : (
                  <span>All months</span>
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

          {/* Role Filter */}
          <DataTableFacetedFilter
            column={table.getColumn("staffRole")}
            title="Role"
            options={[
              { label: "Admin", value: "ADMIN" },
              { label: "Veterinarian", value: "VETERINARIAN" },
              { label: "Worker", value: "WORKER" },
            ]}
          />
        </div>

        {/* Clear Filters Button */}
        {(isFiltered || selectedMonth) && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* View Options */}
      <DataTableViewOptions table={table} />
    </div>
  );
}
