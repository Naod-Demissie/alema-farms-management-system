"use client";

import { useState } from "react";
import { useMobileColumns } from "@/hooks/use-mobile-columns";
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, getFacetedRowModel, getFacetedUniqueValues, ColumnFiltersState, ColumnVisibility, VisibilityState } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { DataTableToolbar } from "@/components/table/data-table-toolbar";
import { FinancialDateFilter } from "./financial-date-filter";
import { getRevenueColumns } from "./revenue-columns";

interface Revenue {
  id: string;
  source: string;
  quantity: number | null;
  costPerQuantity: number | null;
  amount: number;
  date: Date;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface RevenueTableProps {
  data: Revenue[];
  onView: (record: Revenue) => void;
  onEdit: (record: Revenue) => void;
  onDelete: (record: Revenue) => void;
  loading?: boolean;
}

export function RevenueTable({ data, onView, onEdit, onDelete, loading = false }: RevenueTableProps) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  
  const columns = getRevenueColumns(onEdit, onDelete);
  const { mobileColumnVisibility } = useMobileColumns(columns, columnVisibility);

  const table = useReactTable({
    data,
    columns: getRevenueColumns(onEdit, onDelete),
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

  // Prepare source options for filter
  const sourceOptions = [
    { label: "Egg Sales", value: "egg_sales" },
    { label: "Bird Sales", value: "bird_sales" },
    { label: "Manure", value: "manure" },
    { label: "Other", value: "other" },
  ];

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        filterColumnId="description"
        filterPlaceholder="Search revenues..."
        facetedFilters={[
          {
            columnId: "source",
            title: "Source",
            options: sourceOptions,
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
            <p className="mt-2 text-sm text-muted-foreground">Loading revenues...</p>
          </div>
        </div>
      ) : (
        <DataTable
          columns={getRevenueColumns(onView, onEdit, onDelete)}
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
