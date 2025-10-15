"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Table } from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { Thermometer } from "lucide-react";

interface TemperatureAggregatesProps<TData> {
  table: Table<TData>;
}

export function TemperatureAggregates<TData>({
  table,
}: TemperatureAggregatesProps<TData>) {
  const t = useTranslations('environment.temperature.aggregates');
  
  // Get filtered rows from the table
  const filteredRows = table.getFilteredRowModel().rows;
  
  // Calculate aggregates
  const aggregates = React.useMemo(() => {
    let totalMin = 0;
    let totalMax = 0;
    let totalAvg = 0;
    let count = 0;
    
    filteredRows.forEach((row) => {
      const record = row.original as any;
      totalMin += record.minTemp || 0;
      totalMax += record.maxTemp || 0;
      totalAvg += record.avgTemp || ((record.minTemp + record.maxTemp) / 2) || 0;
      count++;
    });
    
    return {
      avgMin: count > 0 ? totalMin / count : 0,
      avgMax: count > 0 ? totalMax / count : 0,
      avgTemp: count > 0 ? totalAvg / count : 0,
      records: count,
    };
  }, [filteredRows]);

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Average Min */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <Thermometer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('avgMin')}</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {aggregates.avgMin.toFixed(1)}°C
            </p>
          </div>
        </div>
        
        {/* Average Max */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
            <Thermometer className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('avgMax')}</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
              {aggregates.avgMax.toFixed(1)}°C
            </p>
          </div>
        </div>
        
        {/* Average Temperature */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
            <Thermometer className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('avgTemp')}</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {aggregates.avgTemp.toFixed(1)}°C
            </p>
          </div>
        </div>
        
        {/* Records Count */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
            <Thermometer className="h-5 w-5 text-purple-600 dark:text-purple-400" />
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

