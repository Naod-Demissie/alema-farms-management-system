"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Table } from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { Lightbulb, Clock, AlertTriangle } from "lucide-react";

interface LightingAggregatesProps<TData> {
  table: Table<TData>;
}

export function LightingAggregates<TData>({
  table,
}: LightingAggregatesProps<TData>) {
  const t = useTranslations('environment.lighting.aggregates');
  
  // Get filtered rows from the table
  const filteredRows = table.getFilteredRowModel().rows;
  
  // Calculate aggregates
  const aggregates = React.useMemo(() => {
    let totalHours = 0;
    let totalInterrupted = 0;
    let count = 0;
    
    filteredRows.forEach((row) => {
      const record = row.original as any;
      totalHours += record.totalHours || 0;
      totalInterrupted += record.interruptedHours || 0;
      count++;
    });
    
    return {
      totalHours,
      avgHours: count > 0 ? totalHours / count : 0,
      totalInterrupted,
      avgInterrupted: count > 0 ? totalInterrupted / count : 0,
      records: count,
    };
  }, [filteredRows]);

  return (
    <Card className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-200 dark:border-amber-800">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Hours */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
            <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('totalHours')}</p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {aggregates.totalHours.toFixed(1)}h
            </p>
          </div>
        </div>
        
        {/* Average Hours */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
            <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('avgHours')}</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {aggregates.avgHours.toFixed(1)}h
            </p>
          </div>
        </div>
        
        {/* Total Interrupted */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('totalInterrupted')}</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
              {aggregates.totalInterrupted.toFixed(1)}h
            </p>
          </div>
        </div>
        
        {/* Records Count */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
            <Lightbulb className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('records')}</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {aggregates.records}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

