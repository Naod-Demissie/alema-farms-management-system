"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { RevenueSource } from "@/lib/generated/prisma";
import { REVENUE_SOURCES } from "@/features/financial/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Revenue {
  id: string;
  flockId: string;
  source: RevenueSource;
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

export const getRevenueColumns = (
  onView: (record: Revenue) => void,
  onEdit: (record: Revenue) => void,
  onDelete: (record: Revenue) => void
): ColumnDef<Revenue>[] => [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      return new Date(row.getValue("date")).toLocaleDateString();
    },
  },
  {
    accessorKey: "flock.batchCode",
    header: "Flock",
    id: "flock",
  },
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => {
      const source = row.getValue("source") as RevenueSource;
      const sourceConfig = REVENUE_SOURCES.find(s => s.value === source);
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          {sourceConfig?.label || source}
        </Badge>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => {
      const quantity = row.getValue("quantity") as number | null;
      return quantity ? quantity.toLocaleString() : "-";
    },
  },
  {
    accessorKey: "costPerQuantity",
    header: "Cost/Unit",
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
    header: "Total Amount",
    cell: ({ row }) => {
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
    header: "Description",
    cell: ({ row }) => {
      const description = row.getValue("description") as string | null;
      return description || "-";
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const revenue = row.original;
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onView(revenue)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(revenue)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(revenue)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
