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
  Bird,
  Scale
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
  LAYER_STARTER: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  REARING: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  PULLET_FEED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  LAYER: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  LAYER_PHASE_1: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  CUSTOM: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
};

const breedLabels = {
  broiler: "Broiler",
  layer: "Layer",
  dual_purpose: "Dual Purpose"
};

const breedColors = {
  broiler: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  layer: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  dual_purpose: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
};

export const programColumns = (
  onView: (record: any) => void,
  onEdit: (record: any) => void,
  onDelete: (record: any) => void
): ColumnDef<any>[] => [
  {
    accessorKey: "breed",
    header: "Breed",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Bird className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline" className={breedColors[record.breed as keyof typeof breedColors] || "bg-gray-100 text-gray-800"}>
            {breedLabels[record.breed as keyof typeof breedLabels] || record.breed}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "ageInWeeks",
    header: "Week",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="text-center">
          <div className="font-medium">{record.ageInWeeks}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "ageInDays",
    header: "Age Range (Days)",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{record.ageInDays}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "feedType",
    header: "Feed Type",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline" className={feedTypeColors[record.feedType as keyof typeof feedTypeColors] || "bg-gray-100 text-gray-800"}>
            {feedTypeLabels[record.feedType as keyof typeof feedTypeLabels] || record.feedType}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "gramPerHen",
    header: "Grams per Hen",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Scale className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{record.gramPerHen}g</span>
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
              Edit Program
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(record)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Program
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
