"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from "lucide-react";
import { Flock } from "./flock-types";
import { format } from "date-fns";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";

export const getFlockColumns = (t: any): ColumnDef<Flock>[] => [
  {
    accessorKey: "id",
    header: t('tableColumns.flockId'),
    cell: ({ row }) => {
      const flock = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="font-mono">
            {flock.batchCode}
          </Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const flock = row.original;
      const flockId = flock.id || "";
      
      // Handle array values from DataTableFacetedFilter
      if (Array.isArray(value)) {
        return value.includes(flockId);
      }
      
      // Handle string values from regular search
      const flockCode = flock.batchCode || flock.id || "";
      return flockCode.toLowerCase().includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "arrivalDate",
    header: t('tableColumns.arrivalDate'),
    cell: ({ row }) => {
      const date = new Date(row.getValue("arrivalDate"));
      return <div>{EthiopianDateFormatter.formatForTable(date)}</div>;
    },
  },
  {
    accessorKey: "age",
    header: t('tableColumns.currentAge'),
    cell: ({ row }) => {
      const flock = row.original;
      const arrivalDate = new Date(flock.arrivalDate);
      const ageAtArrival = flock.ageInDays || 0;
      const today = new Date();
      const daysSinceArrival = Math.floor((today.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalAgeInDays = ageAtArrival + daysSinceArrival;
      
      const weeks = Math.floor(totalAgeInDays / 7);
      const days = totalAgeInDays % 7;
      
      return (
        <div>
          {weeks > 0 && `${weeks}w`}
          {weeks > 0 && days > 0 && ' '}
          {days > 0 && `${days}d`}
          {totalAgeInDays === 0 && '0d'}
          <span className="text-muted-foreground text-sm">
            ({totalAgeInDays}d)
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "initialCount",
    header: t('tableColumns.initialCount'),
    cell: ({ row }) => {
      const count = row.getValue("initialCount") as number;
      return <div>{count.toLocaleString()}</div>;
    },
  },
  {
    accessorKey: "currentCount",
    header: t('tableColumns.currentCount'),
    cell: ({ row }) => {
      const count = row.getValue("currentCount") as number;
      return <div>{count.toLocaleString()}</div>;
    },
  },
  {
    accessorKey: "populationChange",
    header: t('tableColumns.populationChange'),
    cell: ({ row }) => {
      const initialCount = row.getValue("initialCount") as number;
      const currentCount = row.getValue("currentCount") as number;
      const change = currentCount - initialCount;
      const percentage = (change / initialCount) * 100;
      
      return (
        <div className="flex items-center space-x-1">
          {change > 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : change < 0 ? (
            <TrendingDown className="h-4 w-4 text-red-600" />
          ) : null}
          <span className={change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : ''}>
            {change > 0 ? '+' : ''}{change.toLocaleString()}
          </span>
          <span className="text-muted-foreground">
            ({percentage > 0 ? '+' : ''}{percentage.toFixed(1)}%)
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "mortalityRate",
    header: t('tableColumns.mortalityRate'),
    cell: ({ row }) => {
      const flock = row.original;
      const initialCount = flock.initialCount;
      const totalMortality = flock.mortality?.reduce((sum, record) => sum + record.count, 0) || 0;
      const mortalityRate = initialCount > 0 ? (totalMortality / initialCount) * 100 : 0;
      
      const getMortalityStatus = (rate: number) => {
        if (rate > 15) return { status: 'high', color: 'text-red-600', icon: AlertTriangle };
        if (rate > 5) return { status: 'medium', color: 'text-yellow-600', icon: TrendingDown };
        return { status: 'low', color: 'text-green-600', icon: TrendingUp };
      };
      
      const mortalityStatus = getMortalityStatus(mortalityRate);
      const StatusIcon = mortalityStatus.icon;
      
      return (
        <div className="flex items-center space-x-1">
          <StatusIcon className={`h-4 w-4 ${mortalityStatus.color}`} />
          <span className={mortalityStatus.color}>
            {mortalityRate.toFixed(1)}%
          </span>
          <span className="text-muted-foreground text-xs">
            ({totalMortality} {totalMortality === 1 ? t('fields.death') : t('fields.deaths')})
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "morbidityRate",
    header: t('tableColumns.morbidityRate'),
    cell: ({ row }) => {
      const flock = row.original;
      const currentCount = flock.currentCount;
      
      // Calculate morbidity rate based on currently sick birds
      const totalStillSickBirds = flock.treatments
        ?.filter((treatment) => !treatment.endDate || new Date(treatment.endDate) > new Date())
        .reduce((sum, treatment) => sum + (treatment.stillSickCount || 0), 0) || 0;
      
      const morbidityRate = currentCount > 0 ? (totalStillSickBirds / currentCount) * 100 : 0;
      
      const getMorbidityStatus = (rate: number) => {
        if (rate > 10) return { status: 'high', color: 'text-red-600', icon: AlertTriangle };
        if (rate > 3) return { status: 'medium', color: 'text-yellow-600', icon: TrendingDown };
        return { status: 'low', color: 'text-green-600', icon: TrendingUp };
      };
      
      const morbidityStatus = getMorbidityStatus(morbidityRate);
      const StatusIcon = morbidityStatus.icon;
      
      return (
        <div className="flex items-center space-x-1">
          <StatusIcon className={`h-4 w-4 ${morbidityStatus.color}`} />
          <span className={morbidityStatus.color}>
            {morbidityRate.toFixed(1)}%
          </span>
          <span className="text-muted-foreground text-xs">
            ({totalStillSickBirds} sick)
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "notes",
    header: t('tableColumns.notes'),
    cell: ({ row }) => {
      const notes = row.getValue("notes") as string;
      if (!notes) {
        return <div className="text-muted-foreground">-</div>;
      }
      return (
        <div className="max-w-[200px] truncate" title={notes}>
          {notes}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: t('tableColumns.actions'),
    cell: ({ row }) => {
      return <div>Actions will be handled by FlockTable</div>;
    },
  },
];
