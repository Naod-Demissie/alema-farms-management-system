"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Table } from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { 
  Heart, 
  Users
} from "lucide-react";

interface MortalityAggregatesProps<TData> {
  table: Table<TData>;
}

export function MortalityAggregates<TData>({
  table,
}: MortalityAggregatesProps<TData>) {
  const t = useTranslations('health.mortality.aggregates');
  
  // Get filtered rows from the table
  const filteredRows = table.getFilteredRowModel().rows;
  
  // Calculate aggregates
  const aggregates = React.useMemo(() => {
    let totalDeaths = 0;
    
    filteredRows.forEach((row) => {
      const record = row.original as any;
      const count = record.count || 0;
      totalDeaths += count;
    });
    
    return {
      totalDeaths,
      totalRecords: filteredRows.length,
    };
  }, [filteredRows]);

  return (
    <Card className="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200 dark:border-red-800">
      <div className="grid grid-cols-2 gap-4">
        {/* Total Deaths */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
            <Heart className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('totalDeaths')}</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
              {aggregates.totalDeaths.toLocaleString()}
            </p>
          </div>
        </div>
        
        {/* Total Records */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
            <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('totalRecords')}</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {aggregates.totalRecords.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
