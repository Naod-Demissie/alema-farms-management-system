"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";
import { Badge } from "@/components/ui/badge";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Package,
  DollarSign,
  AlertTriangle,
  Calendar,
  Building2
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
  LAYER_STARTER: "bg-blue-100 text-blue-800",
  REARING: "bg-green-100 text-green-800",
  PULLET_FEED: "bg-yellow-100 text-yellow-800",
  LAYER: "bg-purple-100 text-purple-800",
  LAYER_PHASE_1: "bg-pink-100 text-pink-800",
  CUSTOM: "bg-gray-100 text-gray-800"
};

// Utility function to format numbers with commas
const formatNumber = (num: number) => {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const inventoryColumns = (
  onView: (record: any) => void,
  onEdit: (record: any) => void,
  onDelete: (record: any) => void,
  t: any,
  tCommon: any,
  tFeedTypes: any
): ColumnDef<any>[] => [
  {
    accessorKey: "feedType",
    header: t('columns.feedType'),
    cell: ({ row }) => {
      const record = row.original;
      const feedType = record.feedType;
      return (
        <div className="flex items-center space-x-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline" className={feedTypeColors[feedType as keyof typeof feedTypeColors]}>
            {feedType ? tFeedTypes(feedType, { defaultValue: feedType }) : tCommon('unknown')}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "supplier",
    header: t('columns.supplier'),
    cell: ({ row }) => {
      const record = row.original;
      return record.supplier ? (
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{record.supplier.name}</span>
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">{t('noSupplier')}</span>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: t('columns.quantity'),
    cell: ({ row }) => {
      const record = row.original;
      // Database stores all quantities in KG, so convert back to quintal for display if needed
      const displayQuantity = record.unit === 'QUINTAL' 
        ? Number(record.quantity) / 100  // Convert kg back to quintal
        : Number(record.quantity);
      return (
        <div className="text-center">
          <div className="font-medium">{displayQuantity.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">{record.unit}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "costPerUnit",
    header: t('columns.costPerUnit'),
    cell: ({ row }) => {
      const record = row.original;
      return record.costPerUnit ? (
        <div className="flex items-center space-x-1">
          <DollarSign className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-medium">{formatNumber(record.costPerUnit)} {tCommon('birr')}</span>
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">{tCommon('na')}</span>
      );
    },
  },
  {
    accessorKey: "totalCost",
    header: t('columns.totalCost'),
    cell: ({ row }) => {
      const record = row.original;
      const totalCost = record.totalCost || (record.quantity * (record.costPerUnit || 0));
      return totalCost > 0 ? (
        <div className="flex items-center space-x-1">
          <DollarSign className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-medium">{formatNumber(totalCost)} {tCommon('birr')}</span>
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">{tCommon('na')}</span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: t('columns.created'),
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm">
            {EthiopianDateFormatter.formatForTable(new Date(record.createdAt))}
          </div>
        </div>
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
