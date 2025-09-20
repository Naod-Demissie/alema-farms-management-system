"use client";

import { useState } from "react";
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, getFacetedRowModel, getFacetedUniqueValues, ColumnFiltersState, ColumnVisibility, VisibilityState } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { DataTableToolbar } from "@/components/table/data-table-toolbar";
import { getExpenseColumns } from "./expense-columns";

interface Expense {
  id: string;
  flockId: string;
  category: string;
  amount: number;
  date: Date;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  flock: {
    batchCode: string;
    breed: string;
  };
}

interface ExpenseTableProps {
  data: Expense[];
  onView: (record: Expense) => void;
  onEdit: (record: Expense) => void;
  onDelete: (record: Expense) => void;
  flocks: Array<{ id: string; batchCode: string; breed: string }>;
  loading?: boolean;
}

export function ExpenseTable({ data, onView, onEdit, onDelete, flocks, loading = false }: ExpenseTableProps) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns: getExpenseColumns(onView, onEdit, onDelete),
    state: {
      columnFilters,
      columnVisibility,
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Prepare flock options for filter
  const flockOptions = flocks.map(flock => ({
    label: `${flock.batchCode} (${flock.breed})`,
    value: flock.id,
  }));

  // Prepare category options for filter
  const categoryOptions = [
    { label: "Feed", value: "feed" },
    { label: "Medicine", value: "medicine" },
    { label: "Labor", value: "labor" },
    { label: "Utilities", value: "utilities" },
    { label: "Maintenance", value: "maintenance" },
    { label: "Other", value: "other" },
  ];

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        filterColumnId="flock"
        filterPlaceholder="Filter by flock..."
        facetedFilters={[
          {
            columnId: "category",
            title: "Category",
            options: categoryOptions,
          },
        ]}
      />
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span className="text-sm text-muted-foreground">Loading expenses...</span>
          </div>
        </div>
      ) : (
        <DataTable
          columns={getExpenseColumns(onView, onEdit, onDelete)}
          data={data}
          enableFiltering={true}
          enablePagination={true}
          enableSorting={true}
          pageSize={10}
        />
      )}
    </div>
  );
}
