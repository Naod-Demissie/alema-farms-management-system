"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Table } from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { Wheat, Bird, Calendar, TrendingUp } from "lucide-react";

interface FeedUsageAggregatesProps<TData> {
  table: Table<TData>;
}

export function FeedUsageAggregates<TData>({
  table,
}: FeedUsageAggregatesProps<TData>) {
  const t = useTranslations('feed.usage.aggregates');
  
  // Get filtered rows from the table
  const filteredRows = table.getFilteredRowModel().rows;
  
  // Calculate aggregates
  const aggregates = React.useMemo(() => {
    let totalUsage = 0;
    let uniqueFlocks = new Set<string>();
    let uniqueFeedTypes = new Set<string>();
    let todayUsage = 0;
    let thisMonthUsage = 0;
    
    const today = new Date();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    filteredRows.forEach((row) => {
      const record = row.original as any;
      const recordDate = new Date(record.date);
      
      // Total usage
      totalUsage += record.amountUsed || 0;
      
      // Unique flocks
      if (record.flockId) {
        uniqueFlocks.add(record.flockId);
      }
      
      // Unique feed types
      if (record.feed?.feedType) {
        uniqueFeedTypes.add(record.feed.feedType);
      }
      
      // Today's usage
      if (recordDate.toDateString() === today.toDateString()) {
        todayUsage += record.amountUsed || 0;
      }
      
      // This month's usage
      if (recordDate >= monthStart) {
        thisMonthUsage += record.amountUsed || 0;
      }
    });
    
    return {
      totalUsage,
      uniqueFlocks: uniqueFlocks.size,
      uniqueFeedTypes: uniqueFeedTypes.size,
      todayUsage,
      thisMonthUsage,
      totalRecords: filteredRows.length,
    };
  }, [filteredRows]);

  return (
    <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Records */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
            <Wheat className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('totalRecords')}</p>
            <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
              {aggregates.totalRecords}
            </p>
          </div>
        </div>
        
        {/* Total Usage */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
            <Wheat className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('totalUsage')}</p>
            <p className="text-lg font-bold text-green-700 dark:text-green-300">
              {aggregates.totalUsage.toFixed(1)} kg
            </p>
          </div>
        </div>
        
        {/* Feed Types */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
            <Wheat className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('feedTypes')}</p>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
              {aggregates.uniqueFeedTypes}
            </p>
          </div>
        </div>
        
        {/* Active Flocks */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <Bird className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('activeFlocks')}</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
              {aggregates.uniqueFlocks}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
