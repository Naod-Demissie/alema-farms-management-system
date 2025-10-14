"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMobileColumns } from "@/hooks/use-mobile-columns";
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, getFacetedRowModel, getFacetedUniqueValues, ColumnFiltersState, ColumnVisibility, VisibilityState } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { DataTableToolbar } from "@/components/table/data-table-toolbar";
import { FinancialDateFilter } from "../shared/financial-date-filter";
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
  
  const columns = getExpenseColumns(onView, onEdit, onDelete, t, tCommon);
  const { mobileColumnVisibility } = useMobileColumns(columns, columnVisibility);

  const table = useReactTable({
    data,
    columns: getExpenseColumns(onView, onEdit, onDelete, t, tCommon),
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
    { label: t('categories.feed'), value: "feed" },
    { label: t('categories.medicine'), value: "medicine" },
    { label: t('categories.labor'), value: "labor" },
    { label: t('categories.utilities'), value: "utilities" },
    { label: t('categories.maintenance'), value: "maintenance" },
    { label: t('categories.other'), value: "other" },
  ];

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        filterColumnId="description"
        filterPlaceholder={t('table.searchPlaceholder')}
        facetedFilters={[
          {
            columnId: "category",
            title: t('categories.filterTitle'),
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
            <p className="mt-2 text-sm text-muted-foreground">{t('table.loadingMessage')}</p>
          </div>
        </div>
      ) : (
        <DataTable
          columns={getExpenseColumns(onView, onEdit, onDelete, t, tCommon)}
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
