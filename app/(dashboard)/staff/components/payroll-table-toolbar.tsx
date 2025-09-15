"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "@/components/table/data-table-faceted-filter";
import { DataTableViewOptions } from "@/components/table/data-table-view-options";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  // Generate month options
  const monthOptions = [
    { label: "January", value: "0" },
    { label: "February", value: "1" },
    { label: "March", value: "2" },
    { label: "April", value: "3" },
    { label: "May", value: "4" },
    { label: "June", value: "5" },
    { label: "July", value: "6" },
    { label: "August", value: "7" },
    { label: "September", value: "8" },
    { label: "October", value: "9" },
    { label: "November", value: "10" },
    { label: "December", value: "11" },
  ];

  // Generate year options (current year ± 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => {
    const year = currentYear - 5 + i;
    return { label: year.toString(), value: year.toString() };
  });

  // Staff member options for filtering
  const staffOptions = staffList.map((staff) => ({
    label: `${staff.name} (${staff.role})`,
    value: staff.id,
  }));

  // Handle month filter
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    if (month && month !== "all") {
      const monthNum = parseInt(month);
      table.getColumn("paidOn")?.setFilterValue((value: Date) => {
        return new Date(value).getMonth() === monthNum;
      });
    } else {
      table.getColumn("paidOn")?.setFilterValue(undefined);
    }
    onMonthFilterChange?.(month);
  };

  // Handle year filter
  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    if (year && year !== "all") {
      const yearNum = parseInt(year);
      table.getColumn("paidOn")?.setFilterValue((value: Date) => {
        return new Date(value).getFullYear() === yearNum;
      });
    } else {
      table.getColumn("paidOn")?.setFilterValue(undefined);
    }
    onYearFilterChange?.(year);
  };

  // Clear all filters
  const clearFilters = () => {
    table.resetColumnFilters();
    setSelectedMonth("all");
    setSelectedYear("all");
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:space-x-2">
        {/* Search Input */}
        <Input
          placeholder="Filter by staff member..."
          value={(table.getColumn("staffName")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("staffName")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />

        {/* Month Filter */}
        <Select value={selectedMonth} onValueChange={handleMonthChange}>
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue placeholder="All months" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All months</SelectItem>
            {monthOptions.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Year Filter */}
        <Select value={selectedYear} onValueChange={handleYearChange}>
          <SelectTrigger className="h-8 w-[120px]">
            <SelectValue placeholder="All years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All years</SelectItem>
            {yearOptions.map((year) => (
              <SelectItem key={year.value} value={year.value}>
                {year.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Faceted Filters */}
        <div className="flex gap-x-2">
          <DataTableFacetedFilter
            column={table.getColumn("staffRole")}
            title="Role"
            options={[
              { label: "Admin", value: "ADMIN" },
              { label: "Veterinarian", value: "VETERINARIAN" },
              { label: "Worker", value: "WORKER" },
            ]}
          />
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={[
              { label: "Paid", value: "Paid" },
            ]}
          />
        </div>

        {/* Clear Filters */}
        {(isFiltered || selectedMonth !== "all" || selectedYear !== "all") && (
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
      <DataTableViewOptions table={table} />
    </div>
  );
}
