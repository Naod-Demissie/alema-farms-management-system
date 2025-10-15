"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/table/data-table-pagination";
import { DataTableViewOptions } from "@/components/table/data-table-view-options";
import { NoDataIcon } from "@/components/ui/no-data-icon";
import { Droplets } from "lucide-react";
import { useMobileColumns } from "@/hooks/use-mobile-columns";
import { WaterTableToolbar } from "./water-table-toolbar";
import { WaterAggregates } from "./water-aggregates";

interface WaterTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  flocks: Array<{ id: string; batchCode: string; currentCount: number }>;
  enableRowSelection?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  meta?: Record<string, any>;
}

export function WaterTable<TData, TValue>({
  columns,
  data,
  flocks,
  enableRowSelection = true,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  pageSize = 10,
  onRowSelectionChange,
  meta,
}: WaterTableProps<TData, TValue>) {
  const t = useTranslations('feed.water');
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  
  const { mobileColumnVisibility } = useMobileColumns(columns, columnVisibility);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility: mobileColumnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection,
    enableSorting,
    enableFiltering,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
      setRowSelection(newSelection);
      onRowSelectionChange?.(newSelection);
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
    meta: {
      ...meta,
    },
  });

  return (
    <div className="space-y-4">
      <WaterTableToolbar
        table={table}
        flocks={flocks}
      />
      
      {/* Aggregates Display */}
      <WaterAggregates table={table} />
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <NoDataIcon 
                    icon={Droplets}
                    title={t('table.noRecordsFound')}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {enablePagination && (
        <DataTablePagination
          table={table}
          pageSize={pageSize}
        />
      )}
      
      <DataTableViewOptions table={table} />
    </div>
  );
}
