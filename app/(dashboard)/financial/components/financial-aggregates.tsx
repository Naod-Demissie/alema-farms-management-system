"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Table } from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";

interface FinancialAggregatesProps<TData> {
  table: Table<TData>;
  type: "expense" | "revenue";
}

export function FinancialAggregates<TData>({
  table,
  type,
}: FinancialAggregatesProps<TData>) {
  const t = useTranslations('financial.aggregates');
  
  // Get filtered rows from the table
  const filteredRows = table.getFilteredRowModel().rows;
  
  // Calculate total amount
  const totalAmount = React.useMemo(() => {
    let sum = 0;
    filteredRows.forEach((row) => {
      const record = row.original as any;
      sum += record.amount || 0;
    });
    return sum;
  }, [filteredRows]);

  // Calculate number of records
  const recordCount = filteredRows.length;

  // Calculate average amount
  const avgAmount = recordCount > 0 ? totalAmount / recordCount : 0;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
    }).format(value);
  };

  if (type === "expense") {
    return (
      <Card className="p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200 dark:border-red-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Expenses */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-lg">
              <DollarSign className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">{t('totalExpenses')}</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>
          
          {/* Record Count */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">{t('recordCount')}</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {recordCount.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">{t('expenseRecords')}</p>
            </div>
          </div>
          
          {/* Average Expense */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-lg">
              <DollarSign className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">{t('avgExpense')}</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {formatCurrency(avgAmount)}
              </p>
              <p className="text-xs text-muted-foreground">{t('perRecord')}</p>
            </div>
          </div>
        </div>
      </Card>
    );
  } else {
    return (
      <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Revenue */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">{t('totalRevenue')}</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>
          
          {/* Record Count */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">{t('recordCount')}</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {recordCount.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">{t('revenueRecords')}</p>
            </div>
          </div>
          
          {/* Average Revenue */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">{t('avgRevenue')}</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {formatCurrency(avgAmount)}
              </p>
              <p className="text-xs text-muted-foreground">{t('perRecord')}</p>
            </div>
          </div>
        </div>
      </Card>
    );
  }
}

