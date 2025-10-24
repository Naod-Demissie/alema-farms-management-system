"use client";

import React from "react";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataTableFacetedFilter } from "@/components/table/data-table-faceted-filter";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

interface FlockTableToolbarProps<TData> {
  table: Table<TData>;
  flocks: Array<{ id: string; batchCode: string; currentCount: number }>;
}

export function FlockTableToolbar<TData>({
  table,
  flocks,
}: FlockTableToolbarProps<TData>) {
  const t = useTranslations('flocks.table');
  const tColumns = useTranslations('flocks.tableColumns');
  const isFiltered = table.getState().columnFilters.length > 0;

  // Flock options for filtering with bilingual support
  const flockOptions = flocks.map((flock) => ({
    label: `${flock.batchCode} (${flock.currentCount} ${tColumns('birds')})`,
    value: flock.id,
  }));

  // Clear all filters
  const clearFilters = () => {
    table.resetColumnFilters();
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Flock Filter */}
          {table.getColumn("id") && (
            <div className="w-full sm:w-auto">
              <DataTableFacetedFilter
                column={table.getColumn("id")}
                title={tColumns('flockId')}
                options={flockOptions}
              />
            </div>
          )}
        </div>

        {/* Clear Filters */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="h-8 px-2 lg:px-3 w-full sm:w-auto"
          >
            {t('clearFilters')}
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
