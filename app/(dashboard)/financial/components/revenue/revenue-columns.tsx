"use client";

import { format } from "date-fns";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { RevenueSource } from "@/lib/generated/prisma/enums";
import { REVENUE_SOURCES } from "../../types/types";
import { getRevenueSourceBadgeColor } from "../../utils/badge-colors";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";

interface Revenue {
  id: string;
  source: RevenueSource;
  quantity: number | null;
  costPerQuantity: number | null;
  amount: number;
  date: Date;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const getRevenueColumns = (
  onView: (record: Revenue) => void,
  onEdit: (record: Revenue) => void,
  onDelete: (record: Revenue) => void,
  t: any,
  tCommon: any
): ColumnDef<Revenue>[] => [
  {
    accessorKey: "date",
    header: t('columns.date'),
    cell: ({ row }: { row: any }) => {
      return EthiopianDateFormatter.formatForTable(new Date(row.getValue("date")));
    },
    filterFn: (row: any, id: string, value: any) => {
      if (!value) return true;
      const revenue = row.original;
      const revenueDate = new Date(revenue.date);
      const filterDate = new Date(value);
      
      // Check if it's a specific date filter (has day component) or month filter
      const isSpecificDate = filterDate.getDate() !== 1 || 
        filterDate.getHours() !== 0 || 
        filterDate.getMinutes() !== 0 || 
        filterDate.getSeconds() !== 0 ||
        filterDate.getMilliseconds() !== 0;
      
      if (isSpecificDate) {
        // Specific date filtering - match exact date
        return (
          revenueDate.getFullYear() === filterDate.getFullYear() &&
          revenueDate.getMonth() === filterDate.getMonth() &&
          revenueDate.getDate() === filterDate.getDate()
        );
      } else {
        // Month filtering - match month and year
        return (
          revenueDate.getMonth() === filterDate.getMonth() &&
          revenueDate.getFullYear() === filterDate.getFullYear()
        );
      }
    },
  },
  {
    accessorKey: "source",
    header: t('columns.source'),
    cell: ({ row }: { row: any }) => {
      const source = row.getValue("source") as RevenueSource;
      const sourceConfig = REVENUE_SOURCES.find(s => s.value === source);
      const badgeColor = getRevenueSourceBadgeColor(source);
      return (
        <Badge className={badgeColor}>
          {sourceConfig?.label || source}
        </Badge>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: t('columns.quantity'),
    cell: ({ row }: { row: any }) => {
      const quantity = row.getValue("quantity") as number | null;
      return quantity ? quantity.toLocaleString() : "-";
    },
  },
  {
    accessorKey: "costPerQuantity",
    header: t('columns.pricePerUnit'),
    cell: ({ row }: { row: any }) => {
      const costPerQuantity = row.getValue("costPerQuantity") as number | null;
      return costPerQuantity ? new Intl.NumberFormat("en-ET", {
        style: "currency",
        currency: "ETB",
      }).format(costPerQuantity) : "-";
    },
  },
  {
    accessorKey: "amount",
    header: t('columns.amount'),
    cell: ({ row }: { row: any }) => {
      const amount = parseFloat(row.getValue("amount"));
      const revenue = row.original;
      return (
        <div className="text-right">
          <div className="font-semibold text-green-600">
            {new Intl.NumberFormat("en-ET", {
              style: "currency",
              currency: "ETB",
            }).format(amount)}
          </div>
          {revenue.quantity && revenue.costPerQuantity && (
            <div className="text-xs text-muted-foreground">
              {revenue.quantity} × {revenue.costPerQuantity}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: t('columns.description'),
    cell: ({ row }: { row: any }) => {
      const description = row.getValue("description") as string | null;
      return description || "-";
    },
  },
  {
    id: "actions",
    header: tCommon('actions'),
    cell: ({ row }: { row: any }) => {
      const revenue = row.original;
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{tCommon('actions')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onView(revenue)}>
              <Eye className="h-4 w-4 mr-2" />
              {tCommon('view')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(revenue)}>
              <Edit className="h-4 w-4 mr-2" />
              {tCommon('edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(revenue)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {tCommon('delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
