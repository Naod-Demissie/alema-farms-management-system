"use client";

import { useState } from "react";
import { useMobileColumns } from "@/hooks/use-mobile-columns";
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, getFacetedRowModel, getFacetedUniqueValues, ColumnFiltersState, ColumnVisibility, VisibilityState } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { DataTableToolbar } from "@/components/table/data-table-toolbar";
import { FinancialDateFilter } from "./financial-date-filter";
import { getExpenseColumns } from "./expense-columns";

interface Expense {
  id: string;
  flockId: string;
  category: string;
  quantity: number | null;
  costPerQuantity: number | null;
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
  loading?: boolean;
}

export function ExpenseTable({ data, onView, onEdit, onDelete, loading = false }: ExpenseTableProps) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  
  const columns = getExpenseColumns(onView, onEdit, onDelete);
  const { mobileColumnVisibility } = useMobileColumns(columns, columnVisibility);

  const table = useReactTable({
    data,
    columns: getExpenseColumns(onView, onEdit, onDelete),
    state: {
      columnFilters,
      columnVisibility: mobileColumnVisibility,
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
        filterColumnId="description"
        filterPlaceholder="Search expenses..."
        facetedFilters={[
          {
            columnId: "category",
            title: "Category",
            options: categoryOptions,
          },
        ]}
        customFilters={[
          <FinancialDateFilter key="date-filter" table={table} />
        ]}
      />
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading expenses...</p>
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
