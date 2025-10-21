"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";
import { EthiopianCalendarUtils } from "@/lib/ethiopian-calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  AlertTriangle,
  Activity,
  XCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const mortalityColumns = (
  onEdit: (record: any) => void,
  onDelete: (record: any) => void,
  getCauseBadge: (cause: string) => React.ReactNode,
  t?: any
): ColumnDef<any>[] => [
  {
    accessorKey: "flockId",
    header: t ? t('columns.flockId') : "Flock ID",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <Badge variant="outline" className="font-mono">
          {record.flock?.batchCode || record.flockId}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      const record = row.original;
      const flockId = record.flockId || record.flock?.id || "";
      
      // Handle array values from DataTableFacetedFilter (multi-select)
      if (Array.isArray(value)) {
        return value.includes(flockId);
      }
      
      // Handle string values from regular search
      const flockCode = record.flock?.batchCode || record.flockId || "";
      return flockCode.toLowerCase().includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "date",
    header: t ? t('columns.recordedDate') : "Recorded Date",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="font-medium">
            {EthiopianDateFormatter.formatForTable(new Date(record.date))}
          </div>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      if (!value) return true;
      
      const record = row.original;
      const recordDate = new Date(record.date);
      
      // Handle new filter value structure
      if (typeof value === 'object' && value.date) {
        const { date: filterDate, isMonthFilter } = value;
        
        // Convert both dates to Ethiopian calendar
        const recordEthiopian = EthiopianCalendarUtils.gregorianToEthiopian(recordDate);
        const filterEthiopian = EthiopianCalendarUtils.gregorianToEthiopian(filterDate);
        
        if (isMonthFilter) {
          // Month filtering - match Ethiopian month and year
          return (
            recordEthiopian.month === filterEthiopian.month &&
            recordEthiopian.year === filterEthiopian.year
          );
        } else {
          // Specific date filtering - match Ethiopian date
          return (
            recordEthiopian.day === filterEthiopian.day &&
            recordEthiopian.month === filterEthiopian.month &&
            recordEthiopian.year === filterEthiopian.year
          );
        }
      }
      
      return true;
    },
  },
  {
    accessorKey: "recordedBy",
    header: t ? t('columns.recordedBy') : "Recorded By",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="text-sm">
          <div className="font-medium">{record.recordedBy?.name || record.recordedBy || (t ? t('columns.unknown') : "Unknown")}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "count",
    header: t ? t('columns.deaths') : "Deaths",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="text-center">
          <div className="font-medium text-red-600">{record.count}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "cause",
    header: t ? t('columns.cause') : "Cause",
    cell: ({ row }) => {
      const record = row.original;
      return getCauseBadge(record.cause);
    },
    filterFn: (row, id, value) => {
      const record = row.original;
      const cause = record.cause || "";
      
      // Handle array values from DataTableFacetedFilter (multi-select)
      if (Array.isArray(value)) {
        return value.includes(cause);
      }
      
      // Handle string values from regular search
      return cause.toLowerCase().includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "causeDescription",
    header: t ? t('columns.causeDescription') : "Cause Description",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="text-sm">
          <div className="truncate max-w-48">
            {record.causeDescription}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "age",
    header: t ? t('columns.ageAtDeath') : "Age at Death",
    cell: ({ row }) => {
      const record = row.original;
      
      // Calculate age from flock arrival date, age at arrival, and death date
      const calculateAge = () => {
        // Debug logging
        console.log('Mortality record data:', {
          flock: record.flock,
          date: record.date,
          arrivalDate: record.flock?.arrivalDate,
          ageInDays: record.flock?.ageInDays
        });
        
        if (!record.flock?.arrivalDate || !record.date) {
          console.log('Missing data - arrivalDate:', record.flock?.arrivalDate, 'date:', record.date);
          return "N/A";
        }
        
        const arrivalDate = new Date(record.flock.arrivalDate);
        const deathDate = new Date(record.date);
        const ageAtArrival = record.flock.ageInDays || 0;
        
        // Calculate days since arrival
        const daysSinceArrival = Math.floor((deathDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Total age = age at arrival + days since arrival
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
      };
      
      return (
        <div className="text-sm">
          <div className="font-medium">{calculateAge()}</div>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: t ? t('columns.actions') : "Actions",
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
            <DropdownMenuLabel>{t ? t('columns.actions') : "Actions"}</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(record.id)}>
              <Eye className="mr-2 h-4 w-4" />
              {t ? t('columns.viewDetails') : "View Details"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(record)}>
              <Edit className="mr-2 h-4 w-4" />
              {t ? t('columns.editRecord') : "Edit Record"}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(record)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t ? t('columns.deleteRecord') : "Delete Record"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
