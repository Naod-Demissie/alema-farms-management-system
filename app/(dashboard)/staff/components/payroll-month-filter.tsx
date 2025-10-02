"use client";

import { useState, useImperativeHandle, forwardRef } from "react";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MonthPicker } from "@/components/ui/monthpicker";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PayrollRecord } from "./payroll-table-columns";

interface PayrollMonthFilterProps {
  table: Table<PayrollRecord>;
}

export interface PayrollMonthFilterRef {
  reset: () => void;
}

export const PayrollMonthFilter = forwardRef<PayrollMonthFilterRef, PayrollMonthFilterProps>(
  ({ table }, ref) => {
  const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(undefined);

  // Handle month picker change
  const handleMonthSelect = (date: Date | undefined) => {
    setSelectedMonth(date);
    if (date) {
      // Set the filter value to the selected date - the column's filterFn will handle the comparison
      table.getColumn("paidOn")?.setFilterValue(date);
    } else {
      table.getColumn("paidOn")?.setFilterValue(undefined);
    }
  };

  // Reset function
  const reset = () => {
    setSelectedMonth(undefined);
    table.getColumn("paidOn")?.setFilterValue(undefined);
  };

  // Expose reset function to parent
  useImperativeHandle(ref, () => ({
    reset,
  }));

  // Check if month filter is active
  const isMonthFiltered = selectedMonth !== undefined;

  return (
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
  );
});
