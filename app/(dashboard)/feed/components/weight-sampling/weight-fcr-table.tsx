"use client";

import React, { useMemo } from "react";
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, getFacetedRowModel, getFacetedUniqueValues, flexRender } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NoDataIcon } from "@/components/ui/no-data-icon";
import { Scale } from "lucide-react";
import { DataTablePagination } from "@/components/table/data-table-pagination";
import { DataTableToolbar } from "@/components/table/data-table-toolbar";
import { WeightFCRRecord, weightFcrColumns } from "./weight-fcr-columns";
import { useTranslations } from "next-intl";

interface WeightFCRTableProps {
  data: WeightFCRRecord[];
  loading?: boolean;
  toolbarRender?: (table: any) => React.ReactNode;
  onView?: (record: WeightFCRRecord) => void;
  onEdit?: (record: WeightFCRRecord) => void;
  onDelete?: (record: WeightFCRRecord) => void;
}

export function WeightFCRTable({ 
  data, 
  loading = false, 
  toolbarRender,
  onView = () => {},
  onEdit = () => {},
  onDelete = () => {}
}: WeightFCRTableProps) {
  const t = useTranslations("feed.analytics.weightSampling");
  const tCommon = useTranslations("common");
  const columns = weightFcrColumns(onView, onEdit, onDelete, t, tCommon);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: {
      sorting: [{ id: 'date', desc: true }],
      columnVisibility: { flockId: false },
    },
    state: {},
  });

  return (
    <div className="space-y-4">
      {/* Standard Toolbar */}
      {toolbarRender ? toolbarRender(table) : <DataTableToolbar table={table} />}

      <div className="rounded-md border">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading data...</p>
            </div>
          </div>
        ) : (
          <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const className = (header.column.columnDef?.meta as any)?.className || undefined;
                  return (
                    <TableHead key={header.id} className={className}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
                    icon={Scale}
                    title="No weight sampling records found"
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        )}
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}
