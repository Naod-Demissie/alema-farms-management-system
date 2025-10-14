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

const feedTypeColors = {
  LAYER_STARTER: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  REARING: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  PULLET_FEED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  LAYER: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  LAYER_PHASE_1: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  CUSTOM: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
};

export const programColumns = (
  onView: (record: any) => void,
  onEdit: (record: any) => void,
  onDelete: (record: any) => void,
  t: any,
  tCommon: any,
  tFeedTypes: any
): ColumnDef<any>[] => [
  {
    accessorKey: "ageInWeeks",
    header: t('columns.week'),
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
    header: t('columns.ageRange'),
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
    header: t('columns.feedType'),
    cell: ({ row }) => {
      const record = row.original;
      const feedType = record.feedType;
      return (
        <div className="flex items-center space-x-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline" className={feedTypeColors[feedType as keyof typeof feedTypeColors] || "bg-gray-100 text-gray-800"}>
            {feedType ? tFeedTypes(feedType, { defaultValue: feedType }) : tCommon('unknown')}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "gramPerHen",
    header: t('columns.gramsPerHen'),
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Scale className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{record.gramPerHen}g</span>
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
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(record)}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(record)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
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
              <DropdownMenuItem onClick={() => onEdit(record)}>
                <Edit className="mr-2 h-4 w-4" />
                {tCommon('edit')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(record)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {tCommon('delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
