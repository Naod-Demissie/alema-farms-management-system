"use client";

import { format } from "date-fns";
import { useTranslations } from 'next-intl';
import { ColumnDef } from "@tanstack/react-table";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { ExpenseCategory } from "@/lib/generated/prisma/enums";
import { EXPENSE_CATEGORIES } from "../../types/types";
import { getExpenseCategoryBadgeColor } from "../../utils/badge-colors";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Expense {
  id: string;
  flockId: string;
  category: ExpenseCategory;
  quantity: number | null;
  costPerQuantity: number | null;
  amount: number;
  date: Date;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  flock: {
    batchCode: string;
    breed: string;
  };
}

export const getExpenseColumns = (
  onView: (record: Expense) => void,
  onEdit: (record: Expense) => void,
  onDelete: (record: Expense) => void,
  t: any,
  tCommon: any
): ColumnDef<Expense>[] => [
  {
    accessorKey: "date",
    header: t('columns.date'),
    cell: ({ row }) => {
      return EthiopianDateFormatter.formatForTable(new Date(row.getValue("date")));
    },
    filterFn: (row, id, value) => {
      if (!value) return true;
      const expense = row.original;
      const expenseDate = new Date(expense.date);
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
          expenseDate.getFullYear() === filterDate.getFullYear() &&
          expenseDate.getMonth() === filterDate.getMonth() &&
          expenseDate.getDate() === filterDate.getDate()
        );
      } else {
        // Month filtering - match month and year
        return (
          expenseDate.getMonth() === filterDate.getMonth() &&
          expenseDate.getFullYear() === filterDate.getFullYear()
        );
      }
    },
  },
  {
    accessorKey: "category",
    header: t('columns.category'),
    cell: ({ row }) => {
      const category = row.getValue("category") as ExpenseCategory;
      const categoryConfig = EXPENSE_CATEGORIES.find(c => c.value === category);
      const badgeColor = getExpenseCategoryBadgeColor(category);
      return (
        <Badge className={badgeColor}>
          {categoryConfig?.label || category}
        </Badge>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: t('columns.quantity'),
    cell: ({ row }) => {
      const quantity = row.getValue("quantity") as number | null;
      return quantity ? quantity.toLocaleString() : "-";
    },
  },
  {
    accessorKey: "costPerQuantity",
    header: t('columns.costPerUnit'),
    cell: ({ row }) => {
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
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      const expense = row.original;
      return (
        <div className="text-right">
          <div className="font-semibold text-red-600">
            {new Intl.NumberFormat("en-ET", {
              style: "currency",
              currency: "ETB",
            }).format(amount)}
          </div>
          {expense.quantity && expense.costPerQuantity && (
            <div className="text-xs text-muted-foreground">
              {expense.quantity} × {expense.costPerQuantity}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: t('columns.description'),
    cell: ({ row }) => {
      const description = row.getValue("description") as string | null;
      return description || "-";
    },
  },
  {
    id: "actions",
    header: tCommon('actions'),
    cell: ({ row }) => {
      const expense = row.original;
      
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
            <DropdownMenuItem onClick={() => onView(expense)}>
              <Eye className="h-4 w-4 mr-2" />
              {tCommon('view')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(expense)}>
              <Edit className="h-4 w-4 mr-2" />
              {tCommon('edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(expense)}
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
