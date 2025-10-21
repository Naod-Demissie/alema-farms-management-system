import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";

export type WeightFCRRecord = {
  id: string;
  flockId: string;
  date: string; // ISO string for filtering/sorting
  dateDisplay: string;
  sampleSize: number;
  sampleWeights: number[];
  totalWeight: number;
  averageWeight: number;
  fcrLifetime?: number;
  fcrPrevious?: number;
  weightGainLifetime?: number;
  weightGainPrevious?: number;
  isFirstRecording: boolean;
  flockBatchCode: string;
  flockCurrentCount: number;
  recordedByName?: string;
  notes?: string;
};

export const weightFcrColumns = (
  onView: (record: WeightFCRRecord) => void,
  onEdit: (record: WeightFCRRecord) => void,
  onDelete: (record: WeightFCRRecord) => void,
  t?: any,
  tCommon?: any
): ColumnDef<WeightFCRRecord>[] => [
  // Hidden column used for filtering by flock via DataTableFacetedFilter
  {
    accessorKey: "flockId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t?.("flockFilter") || "Flock"} />
    ),
    cell: () => null,
    enableHiding: true,
    enableColumnFilter: true,
    // Enable multi-select values from DataTableFacetedFilter and plain string search
    filterFn: (row, id, value) => {
      const rowFlockId = (row.original as any).flockId || "";
      if (Array.isArray(value)) {
        return value.includes(rowFlockId);
      }
      if (typeof value === 'string') {
        // Allow searching by flock code as well if present on the row
        const flockCode = (row.original as any).flockBatchCode || "";
        return flockCode.toLowerCase().includes(value.toLowerCase());
      }
      return true;
    },
    meta: { className: "hidden" },
  },
  {
    accessorKey: "flockBatchCode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t?.("flockFilter") || "Flock"} />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.flockBatchCode}</span>
        <span className="text-xs text-muted-foreground">{row.original.flockCurrentCount} {t?.("birds") || "birds"}</span>
      </div>
    ),
    enableColumnFilter: true,
    meta: { className: "min-w-[140px]" },
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t?.("date") || "Date"} />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.dateDisplay}</span>
      </div>
    ),
    sortingFn: "datetime",
    enableColumnFilter: true,
    meta: { className: "min-w-[140px]" },
  },
  {
    accessorKey: "sampleSize",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t?.("sampleSize") || "Sample Size"} />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{row.original.sampleSize}</span>
        <span className="text-xs text-muted-foreground">{t?.("birds") || "birds"}</span>
      </div>
    ),
    meta: { className: "min-w-[120px]" },
  },
  {
    accessorKey: "totalWeight",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t?.("totalWeight") || "Total Weight"} />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{row.original.totalWeight.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">{tCommon?.("kg") || "kg"}</span>
      </div>
    ),
    meta: { className: "min-w-[130px]" },
  },
  {
    accessorKey: "averageWeight",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t?.("avgWeight") || "Avg Weight"} />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{row.original.averageWeight.toFixed(2)}</span>
        <span className="text-xs text-muted-foreground">{tCommon?.("kg") || "kg"}</span>
      </div>
    ),
    meta: { className: "min-w-[120px]" },
  },
  {
    id: "fcrLifetime",
    accessorKey: "fcrLifetime",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t?.("fcrLifetime") || "FCR Lifetime"} />
    ),
    cell: ({ row }) => (
      row.original.isFirstRecording ? (
        <span className="text-muted-foreground text-sm">{tCommon?.("na") || "N/A"}</span>
      ) : (
        <div className="flex flex-col">
          <span className="font-medium">{(row.original.fcrLifetime ?? 0).toFixed(2)}</span>
          <span className="text-xs text-muted-foreground">
            {(row.original.weightGainLifetime ?? 0).toFixed(1)}kg gain
          </span>
        </div>
      )
    ),
    meta: { className: "min-w-[140px]" },
  },
  {
    id: "fcrPrevious",
    accessorKey: "fcrPrevious",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t?.("fcrPrevious") || "FCR Previous"} />
    ),
    cell: ({ row }) => (
      row.original.isFirstRecording ? (
        <span className="text-muted-foreground text-sm">{tCommon?.("na") || "N/A"}</span>
      ) : (
        <div className="flex flex-col">
          <span className="font-medium">{(row.original.fcrPrevious ?? 0).toFixed(2)}</span>
          <span className="text-xs text-muted-foreground">
            {(row.original.weightGainPrevious ?? 0).toFixed(1)}{tCommon?.("kg") || "kg"} {t?.("gain") || "gain"}
          </span>
        </div>
      )
    ),
    meta: { className: "min-w-[140px]" },
  },
  {
    accessorKey: "recordedByName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t?.("recordedBy") || "Recorded By"} />
    ),
    cell: ({ row }) => (row.original.recordedByName || tCommon?.("unknown") || "Unknown"),
    meta: { className: "min-w-[140px]" },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{tCommon?.("actions") || "Actions"}</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onView(record)}>
              <Eye className="mr-2 h-4 w-4" />
              {tCommon?.("view") || "View"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(record)}>
              <Edit className="mr-2 h-4 w-4" />
              {tCommon?.("edit") || "Edit"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(record)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              {tCommon?.("delete") || "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    meta: { className: "w-[80px]" },
  },
];
