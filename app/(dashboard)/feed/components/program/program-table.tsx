"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMobileColumns } from "@/hooks/use-mobile-columns";
import {
  ColumnDef,
  ColumnFiltersState,
  RowData,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
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
import { DataTableToolbar } from "@/components/table/data-table-toolbar";
import { NoDataIcon } from "@/components/ui/no-data-icon";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className: string;
  }
}

interface ProgramTableProps {
  columns: ColumnDef<any>[];
  data: any[];
  toolbar?: React.ReactNode;
  onView?: (record: any) => void;
  onEdit?: (record: any) => void;
  onDelete?: (record: any) => void;
  loading?: boolean;
}

export function ProgramTable({ columns, data, toolbar, onView, onEdit, onDelete, loading = false }: ProgramTableProps) {
  const t = useTranslations('feed.program');
  const tCommon = useTranslations('feed.common');
  const tFeedTypes = useTranslations('feed.feedTypes');
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  
  const { mobileColumnVisibility } = useMobileColumns(columns, columnVisibility);

  const table = useReactTable({
    data,
    columns: columns.map(col => {
      if (col.id === 'actions') {
        return {
          ...col,
          cell: ({ row }: any) => {
            const record = row.original;
            
            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView?.(record)}>
                    <Eye className="h-4 w-4 mr-2" />
                    {tCommon('viewDetails')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit?.(record)}>
                    <Edit className="h-4 w-4 mr-2" />
                    {tCommon('edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete?.(record)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {tCommon('delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }
        };
      }
      return col;
    }),
    state: {
      sorting,
      columnVisibility: mobileColumnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="space-y-4">
      {toolbar || (
        <DataTableToolbar
          table={table}
          filterColumnId="feedType"
          filterPlaceholder={t('table.searchPlaceholder')}
          facetedFilters={[
            {
              columnId: "feedType",
              title: t('columns.feedType'),
              options: [
                { label: tFeedTypes('LAYER_STARTER'), value: "LAYER_STARTER" },
                { label: tFeedTypes('REARING'), value: "REARING" },
                { label: tFeedTypes('PULLET_FEED'), value: "PULLET_FEED" },
                { label: tFeedTypes('LAYER'), value: "LAYER" },
                { label: tFeedTypes('LAYER_PHASE_1'), value: "LAYER_PHASE_1" },
                { label: tFeedTypes('CUSTOM'), value: "CUSTOM" },
              ],
            },
          ]}
        />
      )}
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
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Loading feed program...</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
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
                    icon={BookOpen}
                    title={t('noProgram')}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
