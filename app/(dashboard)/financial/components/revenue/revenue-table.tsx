"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMobileColumns } from "@/hooks/use-mobile-columns";
import { 
  useReactTable, 
  getCoreRowModel, 
  getFilteredRowModel, 
  getPaginationRowModel, 
  getSortedRowModel, 
  getFacetedRowModel, 
  getFacetedUniqueValues, 
  ColumnFiltersState, 
  SortingState,
  VisibilityState,
  flexRender 
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
import { NoDataIcon } from "@/components/ui/no-data-icon";
import { TrendingUp } from "lucide-react";
import { RevenueTableToolbar } from "./revenue-table-toolbar";
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
  const t = useTranslations('financial.revenue');
  const tCommon = useTranslations('financial.common');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  
  const columns = getRevenueColumns(onView, onEdit, onDelete, t, tCommon);
  const { mobileColumnVisibility } = useMobileColumns(columns, columnVisibility);

  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
      columnVisibility: mobileColumnVisibility,
      sorting,
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Prepare source options for filter
  const sourceOptions = [
    { label: t('sources.egg_sales'), value: "egg_sales" },
    { label: t('sources.bird_sales'), value: "bird_sales" },
    { label: t('sources.manure'), value: "manure" },
    { label: t('sources.other'), value: "other" },
  ];

  return (
    <div className="space-y-4">
      <RevenueTableToolbar
        table={table}
        sourceOptions={sourceOptions}
      />
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">{t('table.loadingMessage')}</p>
          </div>
        </div>
      ) : (
        <>
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
                        icon={TrendingUp}
                        title={t('table.noRecordsFound') || 'No records found'}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <DataTablePagination table={table} />
        </>
      )}
    </div>
  );
}
