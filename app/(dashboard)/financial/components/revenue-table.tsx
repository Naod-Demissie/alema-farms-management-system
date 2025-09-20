"use client";

import { useState } from "react";
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, getFacetedRowModel, getFacetedUniqueValues, ColumnFiltersState, ColumnVisibility, VisibilityState } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { DataTableToolbar } from "@/components/table/data-table-toolbar";
import { getRevenueColumns } from "./revenue-columns";

interface Revenue {
  id: string;
  flockId: string;
  source: string;
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

interface RevenueTableProps {
  data: Revenue[];
  onView: (record: Revenue) => void;
  onEdit: (record: Revenue) => void;
  onDelete: (record: Revenue) => void;
  flocks: Array<{ id: string; batchCode: string; breed: string }>;
  loading?: boolean;
}

export function RevenueTable({ data, onView, onEdit, onDelete, flocks, loading = false }: RevenueTableProps) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns: getRevenueColumns(onEdit, onDelete),
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

  // Prepare source options for filter
  const sourceOptions = [
    { label: "Egg Sales", value: "egg_sales" },
    { label: "Bird Sales", value: "bird_sales" },
    { label: "Subsidy", value: "subsidy" },
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
            columnId: "source",
            title: "Source",
            options: sourceOptions,
          },
        ]}
      />
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span className="text-sm text-muted-foreground">Loading revenues...</span>
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
