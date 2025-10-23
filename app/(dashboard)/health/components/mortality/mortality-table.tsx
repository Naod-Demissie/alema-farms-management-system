"use client";

import { useState } from "react";
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
import { DataTableFacetedFilter } from "@/components/table/data-table-faceted-filter";
import { MortalityTableToolbar } from "./mortality-table-toolbar";
import { MortalityAggregates } from "./mortality-aggregates";
import { NoDataIcon } from "@/components/ui/no-data-icon";
import { Heart } from "lucide-react";
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
} from "lucide-react";
import { useTranslations } from 'next-intl';

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className: string;
  }
}

interface MortalityTableProps {
  columns: ColumnDef<any>[];
  data: any[];
  toolbar?: React.ReactNode;
  flocks?: Array<{ id: string; batchCode: string; currentCount: number }>;
  onEdit?: (record: any) => void;
  onDelete?: (record: any) => void;
}

export function MortalityTable({ columns, data, toolbar, flocks = [], onEdit, onDelete }: MortalityTableProps) {
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const t = useTranslations('health.mortality');
  
  const { mobileColumnVisibility } = useMobileColumns(columns, columnVisibility);

  // Flock options for filtering
  const flockOptions = flocks.map((flock) => ({
    label: `${flock.batchCode} (${flock.currentCount} birds)`,
    value: flock.id,
  }));

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
                  <DropdownMenuItem onClick={() => onEdit?.(record)}>
                    <Edit className="h-4 w-4 mr-2" />
                    {t('editRecord')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete?.(record)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('deleteRecord')}
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
      <MortalityTableToolbar
        table={table}
        flocks={flocks}
      />
      
      {/* Aggregates Display */}
      <MortalityAggregates
        table={table}
      />
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="group/row">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={header.column.columnDef.meta?.className ?? ""}
                    >
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
                  className="group/row hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.columnDef.meta?.className ?? ""}
                    >
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
                    icon={Heart}
                    title={t("noRecords")}
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
