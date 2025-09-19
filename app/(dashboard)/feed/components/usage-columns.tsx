"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  Package,
  DollarSign,
  Users,
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

const feedTypeLabels = {
  starter: "Starter",
  grower: "Grower", 
  finisher: "Finisher",
  layer: "Layer",
  custom: "Custom"
};

const feedTypeColors = {
  starter: "bg-blue-100 text-blue-800",
  grower: "bg-green-100 text-green-800",
  finisher: "bg-yellow-100 text-yellow-800",
  layer: "bg-purple-100 text-purple-800",
  custom: "bg-gray-100 text-gray-800"
};

const breedLabels = {
  broiler: "Broiler",
  layer: "Layer",
  dual_purpose: "Dual Purpose"
};

const breedColors = {
  broiler: "bg-orange-100 text-orange-800",
  layer: "bg-pink-100 text-pink-800",
  dual_purpose: "bg-indigo-100 text-indigo-800"
};

export const usageColumns = (
  onView: (record: any) => void,
  onEdit: (record: any) => void,
  onDelete: (record: any) => void
): ColumnDef<any>[] => [
  {
    accessorKey: "flock",
    header: "Flock",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{record.flock?.batchCode || "Unknown"}</div>
            <Badge variant="outline" className={breedColors[record.flock?.breed as keyof typeof breedColors] || "bg-gray-100 text-gray-800"}>
              {breedLabels[record.flock?.breed as keyof typeof breedLabels] || record.flock?.breed || "Unknown"}
            </Badge>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "feed",
    header: "Feed",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{record.feed?.feedType || "Unknown"}</div>
            <Badge variant="outline" className={feedTypeColors[record.feed?.feedType as keyof typeof feedTypeColors] || "bg-gray-100 text-gray-800"}>
              {feedTypeLabels[record.feed?.feedType as keyof typeof feedTypeLabels] || record.feed?.feedType || "Unknown"}
            </Badge>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm">
            {new Date(record.date).toLocaleDateString()}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "amountUsed",
    header: "Amount Used",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="text-center">
          <div className="font-medium">{record.amountUsed}</div>
          <div className="text-xs text-muted-foreground">{record.unit}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "cost",
    header: "Cost",
    cell: ({ row }) => {
      const record = row.original;
      return record.cost ? (
        <div className="flex items-center space-x-1">
          <DollarSign className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-medium">{record.cost.toFixed(2)} ETB</span>
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">N/A</span>
      );
    },
  },
  {
    accessorKey: "recordedBy",
    header: "Recorded By",
    cell: ({ row }) => {
      const record = row.original;
      return record.recordedBy ? (
        <div className="text-sm font-medium">{record.recordedBy.name || record.recordedBy}</div>
      ) : (
        <span className="text-muted-foreground text-sm">Unknown</span>
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
              Edit Record
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(record)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Record
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
