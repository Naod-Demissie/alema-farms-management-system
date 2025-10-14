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
import { DollarSign } from "lucide-react";
import { ExpenseTableToolbar } from "./expense-table-toolbar";
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
  const t = useTranslations('financial.expenses');
  const tCommon = useTranslations('financial.common');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  
  const columns = getExpenseColumns(onView, onEdit, onDelete, t, tCommon);
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

  // Prepare category options for filter
  const categoryOptions = [
    { label: t('categories.feed'), value: "feed" },
    { label: t('categories.medicine'), value: "medicine" },
    { label: t('categories.labor'), value: "labor" },
    { label: t('categories.utilities'), value: "utilities" },
    { label: t('categories.maintenance'), value: "maintenance" },
    { label: t('categories.other'), value: "other" },
  ];

  return (
    <div className="space-y-4">
      <ExpenseTableToolbar
        table={table}
        categoryOptions={categoryOptions}
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
                        icon={DollarSign}
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
