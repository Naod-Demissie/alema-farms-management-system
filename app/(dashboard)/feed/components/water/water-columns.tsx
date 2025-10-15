"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Calendar,
  Droplets,
  User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";

export const waterConsumptionColumns = (
  onEdit: (record: any) => void,
  onDelete: (record: any) => void,
  t: any,
  tCommon: any
): ColumnDef<any>[] => [
  {
    accessorKey: "flockId",
    header: t('columns.flock'),
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
      const flockCode = record.flock?.batchCode || record.flockId || "";
      return flockCode.toLowerCase().includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "date",
    header: t('columns.date'),
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {EthiopianDateFormatter.formatForTable(new Date(record.date))}
          </span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      if (!value) return true;
      const rowDate = new Date(row.getValue(id));
      const filterDate = new Date(value.date);
      
      if (value.isMonthFilter) {
        return rowDate.getMonth() === filterDate.getMonth() &&
               rowDate.getFullYear() === filterDate.getFullYear();
      } else {
        return rowDate.toDateString() === filterDate.toDateString();
      }
    },
  },
  {
    accessorKey: "consumption",
    header: t('columns.consumption'),
    cell: ({ row }) => {
      const record = row.original;
      const consumption = Number(record.consumption || 0);
      const birds = record.flock?.currentCount || 0;
      const perBird = birds > 0 ? consumption / birds : 0;
      
      return (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{consumption.toFixed(1)} {t('columns.liters')}</span>
          </div>
          {birds > 0 && (
            <div className="text-xs text-muted-foreground">
              {perBird.toFixed(2)} {t('columns.litersPerBird')}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "flock.currentCount",
    header: t('columns.birds'),
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="text-sm">
          {record.flock?.currentCount?.toLocaleString() || "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "recordedBy",
    header: t('columns.recordedBy'),
    cell: ({ row }) => {
      const record = row.original;
      return record.recordedBy ? (
        <div className="flex items-center space-x-2">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{record.recordedBy.name}</span>
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">{tCommon('na')}</span>
      );
    },
  },
  {
    id: "actions",
    header: tCommon('actions'),
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
            <DropdownMenuLabel>{tCommon('actions')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(record)}>
              <Edit className="mr-2 h-4 w-4" />
              {tCommon('edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(record)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {tCommon('delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

