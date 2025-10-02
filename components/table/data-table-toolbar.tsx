"use client";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableViewOptions } from "./data-table-view-options";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  filterColumnId?: string;
  filterPlaceholder?: string;
  facetedFilters?: {
    columnId: string;
    title: string;
    options: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }[];
  }[];
  customFilters?: React.ReactNode[];
  onResetCustomFilters?: () => void;
}

export function DataTableToolbar<TData>({
  table,
  filterColumnId,
  filterPlaceholder,
  facetedFilters,
  customFilters,
  onResetCustomFilters,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
        {filterColumnId && (
          <Input
            placeholder={filterPlaceholder || `Filter ${filterColumnId}...`}
            value={
              (table.getColumn(filterColumnId)?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn(filterColumnId)?.setFilterValue(event.target.value)
            }
            className="h-8 w-full sm:w-[150px] lg:w-[250px]"
          />
        )}
        <div className="flex flex-wrap gap-2">
          {facetedFilters?.map((filter) =>
            table.getColumn(filter.columnId) && (
              <DataTableFacetedFilter
                key={filter.columnId}
                column={table.getColumn(filter.columnId)}
                title={filter.title}
                options={filter.options}
              />
            )
          )}
          {customFilters?.map((filter, index) => (
            <div key={index}>{filter}</div>
          ))}
        </div>
        {(isFiltered || customFilters) && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              onResetCustomFilters?.();
            }}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}


