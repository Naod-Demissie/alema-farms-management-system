"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Table } from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { Egg, Bird, Droplets } from "lucide-react";

interface ProductionAggregatesProps<TData> {
  table: Table<TData>;
  productionType: "eggs" | "broiler" | "manure";
}

export function ProductionAggregates<TData>({
  table,
  productionType,
}: ProductionAggregatesProps<TData>) {
  const t = useTranslations('production.aggregates');
  
  // Get filtered rows from the table
  const filteredRows = table.getFilteredRowModel().rows;
  
  // Calculate aggregates based on production type
  const aggregates = React.useMemo(() => {
    if (productionType === "eggs") {
      const totals = {
        normal: 0,
        cracked: 0,
        spoiled: 0,
        total: 0,
      };
      
      filteredRows.forEach((row) => {
        const record = row.original as any;
        const gradeCounts = record.gradeCounts || {};
        totals.normal += gradeCounts.normal || 0;
        totals.cracked += gradeCounts.cracked || 0;
        totals.spoiled += gradeCounts.spoiled || 0;
        totals.total += record.totalCount || 0;
      });
      
      return totals;
    } else if (productionType === "broiler" || productionType === "manure") {
      let quantity = 0;
      
      filteredRows.forEach((row) => {
        const record = row.original as any;
        quantity += record.quantity || 0;
      });
      
      return { quantity };
    }
    
    return {};
  }, [filteredRows, productionType]);

  // Render based on production type
  if (productionType === "eggs") {
    const eggAggregates = aggregates as { normal: number; cracked: number; spoiled: number; total: number };
    
    return (
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Egg className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{t('total')}</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {eggAggregates.total.toLocaleString()}
              </p>
            </div>
          </div>
          
          {/* Normal */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <Egg className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{t('normal')}</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {eggAggregates.normal.toLocaleString()}
              </p>
            </div>
          </div>
          
          {/* Cracked */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
              <Egg className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{t('cracked')}</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {eggAggregates.cracked.toLocaleString()}
              </p>
            </div>
          </div>
          
          {/* Spoiled */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
              <Egg className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{t('spoiled')}</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {eggAggregates.spoiled.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  } else if (productionType === "broiler") {
    const broilerAggregates = aggregates as { quantity: number };
    
    return (
      <Card className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
            <Bird className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">{t('totalBirds')}</p>
            <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
              {broilerAggregates.quantity.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">{t('birdsInFilter')}</p>
          </div>
        </div>
      </Card>
    );
  } else if (productionType === "manure") {
    const manureAggregates = aggregates as { quantity: number };
    
    return (
      <Card className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
            <Droplets className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">{t('totalQuantity')}</p>
            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
              {manureAggregates.quantity.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">{t('bagsInFilter')}</p>
          </div>
        </div>
      </Card>
    );
  }
  
  return null;
}

