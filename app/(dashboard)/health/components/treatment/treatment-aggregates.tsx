"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Stethoscope, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Activity
} from "lucide-react";
import { Table } from "@tanstack/react-table";

interface TreatmentAggregatesProps<TData> {
  table: Table<TData>;
}

export function TreatmentAggregates<TData>({
  table,
}: TreatmentAggregatesProps<TData>) {
  const t = useTranslations('health.treatment.aggregates');
  
  // Get filtered rows from the table
  const filteredRows = table.getFilteredRowModel().rows;
  
  // Calculate aggregates for treatment data
  const aggregates = React.useMemo(() => {
    const totals = {
      totalDiseased: 0,
      totalDeceased: 0,
      totalRecovered: 0,
      totalStillSick: 0,
      totalTreatments: 0,
    };
    
    filteredRows.forEach((row) => {
      const record = row.original as any;
      
      // Count total diseased birds
      totals.totalDiseased += record.diseasedBirdsCount || 0;
      
      // Count total treatments
      totals.totalTreatments += 1;
      
      // Count status updates if available
      if (record.statusUpdates && Array.isArray(record.statusUpdates)) {
        record.statusUpdates.forEach((update: any) => {
          totals.totalDeceased += update.deceasedCount || 0;
          totals.totalRecovered += update.recoveredCount || 0;
          totals.totalStillSick += update.stillSickCount || 0;
        });
      }
    });
    
    return totals;
  }, [filteredRows]);

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Treatments */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('totalTreatments')}</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {aggregates.totalTreatments.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Total Diseased Birds */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('totalDiseased')}</p>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {aggregates.totalDiseased.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Total Recovered */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('totalRecovered')}</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {aggregates.totalRecovered.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Total Still Sick */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
            <Activity className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('totalStillSick')}</p>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
              {aggregates.totalStillSick.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Total Deceased */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('totalDeceased')}</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
              {aggregates.totalDeceased.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
