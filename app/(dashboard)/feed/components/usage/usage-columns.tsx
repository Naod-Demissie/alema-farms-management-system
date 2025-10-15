"use client";

import { format } from "date-fns";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  Package,
  Bird,
  FileText,
  CheckCircle,
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

const feedTypeColors = {
  LAYER_STARTER: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  REARING: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  PULLET_FEED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  LAYER: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  LAYER_PHASE_1: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  CUSTOM: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
};

export const usageColumns = (
  onView: (record: any) => void,
  onEdit: (record: any) => void,
  onDelete: (record: any) => void,
  t: any,
  tCommon: any
): ColumnDef<any>[] => [
  {
    accessorKey: "flock",
    header: t('columns.flockId'),
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Bird className="h-4 w-4 text-muted-foreground" />
          <div className="font-medium">{record.flock?.batchCode || tCommon('unknown')}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "feed.feedType",
    id: "feed",
    header: t('columns.feedType'),
    cell: ({ row }) => {
      const record = row.original;
      const feedType = record.feed?.feedType;
      return (
        <div className="flex items-center space-x-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline" className={feedTypeColors[feedType as keyof typeof feedTypeColors] || "bg-gray-100 text-gray-800"}>
            {feedType ? t(`feedTypes.${feedType}`, { defaultValue: feedType }) : tCommon('unknown')}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "date",
    id: "date",
    header: t('columns.date'),
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm">
            {EthiopianDateFormatter.formatForTable(new Date(record.date))}
          </div>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      if (!value) return true;
      
      const rowDate = new Date(row.getValue(id));
      const filterDate = value.date;
      const isMonthFilter = value.isMonthFilter;
      
      if (isMonthFilter) {
        // Filter by month
        return rowDate.getFullYear() === filterDate.getFullYear() && 
               rowDate.getMonth() === filterDate.getMonth();
      } else {
        // Filter by specific date
        return rowDate.toDateString() === filterDate.toDateString();
      }
    },
  },
  {
    accessorKey: "amountUsed",
    header: t('columns.amountUsed'),
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="text-center">
          <div className="font-medium">{record.amountUsed}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "unit",
    id: "unit",
    header: t('columns.unit'),
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="text-center">
          <Badge variant="outline" className="text-xs">
            {record.unit}
          </Badge>
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
          <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <span className="text-xs font-medium text-blue-800 dark:text-blue-300">
              {record.recordedBy.firstName?.[0]}{record.recordedBy.lastName?.[0]}
            </span>
          </div>
          <div>
            <div className="text-sm font-medium">
              {record.recordedBy.firstName} {record.recordedBy.lastName}
            </div>
            <div className="text-xs text-muted-foreground">
              {record.recordedBy.role}
            </div>
          </div>
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">{tCommon('unknown')}</span>
      );
    },
  },
  {
    accessorKey: "notes",
    header: t('columns.notes'),
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="text-sm">
          <div className="truncate max-w-48" title={record.notes}>
            {record.notes || tCommon('na')}
          </div>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: t('columns.actions'),
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
            <DropdownMenuItem onClick={() => onView(record)}>
              <Eye className="mr-2 h-4 w-4" />
              {tCommon('viewDetails')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(record)}>
              <Edit className="mr-2 h-4 w-4" />
              {tCommon('editRecord')}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(record)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {tCommon('deleteRecord')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
