"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Package,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
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

const feedTypeLabels = {
  LAYER_STARTER: "Layer Starter",
  REARING: "Rearing",
  PULLET_FEED: "Pullet Feed",
  LAYER: "Layer",
  LAYER_PHASE_1: "Layer Phase 1",
  CUSTOM: "Custom"
};

const feedTypeColors = {
  LAYER_STARTER: "bg-blue-100 text-blue-800",
  REARING: "bg-green-100 text-green-800",
  PULLET_FEED: "bg-yellow-100 text-yellow-800",
  LAYER: "bg-purple-100 text-purple-800",
  LAYER_PHASE_1: "bg-pink-100 text-pink-800",
  CUSTOM: "bg-gray-100 text-gray-800"
};

export const inventoryColumns = (
  onView: (record: any) => void,
  onEdit: (record: any) => void,
  onDelete: (record: any) => void,
  getStatusBadge: (isActive: boolean) => React.ReactNode
): ColumnDef<any>[] => [
  {
    accessorKey: "feedType",
    header: "Feed Type",
    cell: ({ row }) => {
      const record = row.original;
      const type = record.feedType as keyof typeof feedTypeLabels;
      return (
        <div className="flex items-center space-x-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline" className={feedTypeColors[type as keyof typeof feedTypeColors]}>
            {feedTypeLabels[type as keyof typeof feedTypeLabels]}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "supplier",
    header: "Supplier",
    cell: ({ row }) => {
      const record = row.original;
      return record.supplier ? (
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{record.supplier.name}</span>
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">No supplier</span>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="text-center">
          <div className="font-medium">{Number(record.quantity).toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">{record.unit}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "costPerUnit",
    header: "Cost/Unit",
    cell: ({ row }) => {
      const record = row.original;
      return record.costPerUnit ? (
        <div className="flex items-center space-x-1">
          <DollarSign className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-medium">{record.costPerUnit.toFixed(2)} ETB</span>
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">N/A</span>
      );
    },
  },
  {
    accessorKey: "totalCost",
    header: "Total Cost",
    cell: ({ row }) => {
      const record = row.original;
      const totalCost = record.totalCost || (record.quantity * (record.costPerUnit || 0));
      return totalCost > 0 ? (
        <div className="flex items-center space-x-1">
          <DollarSign className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-medium">{totalCost.toFixed(2)} ETB</span>
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">N/A</span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm">
            {new Date(record.createdAt).toLocaleDateString()}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="text-sm">
          <div className="truncate max-w-48" title={record.notes}>
            {record.notes || "N/A"}
          </div>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
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
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onView(record)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(record)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Item
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(record)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
