"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Table } from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { Droplets, Bird, Activity } from "lucide-react";

interface WaterAggregatesProps<TData> {
  table: Table<TData>;
}

export function WaterAggregates<TData>({
  table,
}: WaterAggregatesProps<TData>) {
  const t = useTranslations('feed.water.aggregates');
  
  // Get filtered rows from the table
  const filteredRows = table.getFilteredRowModel().rows;
  
  // Calculate aggregates
  const aggregates = React.useMemo(() => {
    let totalConsumption = 0;
    let totalBirds = 0;
    let recordCount = 0;
    
    filteredRows.forEach((row) => {
      const record = row.original as any;
      totalConsumption += record.consumption || 0;
      totalBirds += record.flock?.currentCount || 0;
      recordCount++;
    });
    
    const avgPerBird = totalBirds > 0 ? totalConsumption / totalBirds : 0;
    
    return {
      totalConsumption,
      totalBirds,
      avgPerBird,
      recordCount,
    };
  }, [filteredRows]);

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Consumption */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <Droplets className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('totalConsumption')}</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {aggregates.totalConsumption.toFixed(1)}L
            </p>
          </div>
        </div>
        
        {/* Average Per Bird */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-100 dark:bg-cyan-900/50 rounded-lg">
            <Bird className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('avgPerBird')}</p>
            <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
              {aggregates.avgPerBird.toFixed(2)}L
            </p>
          </div>
        </div>
        
        {/* Total Birds */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
            <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('totalBirds')}</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {aggregates.totalBirds.toLocaleString()}
            </p>
          </div>
        </div>
        
        {/* Records Count */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
            <Droplets className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('records')}</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {aggregates.recordCount}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

