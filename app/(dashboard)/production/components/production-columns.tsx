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
  Egg,
  Bird,
  Droplets,
  FileText
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

const eggGradeColors = {
  normal: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  cracked: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  spoiled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
};


export const eggProductionColumns = (
  onView: (record: any) => void,
  onEdit: (record: any) => void,
  onDelete: (record: any) => void
): ColumnDef<any>[] => [
  {
    accessorKey: "flockId",
    header: "Flock",
    cell: ({ row }) => {
      const production = row.original;
      return (
        <Badge variant="outline" className="font-mono">
          {production.flock?.batchCode || production.flockId}
        </Badge>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const production = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {format(new Date(production.date), "MMM dd, yyyy")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "gradeCounts",
    header: "Grade Breakdown",
    cell: ({ row }) => {
      const production = row.original;
      const counts = production.gradeCounts as { normal: number; cracked: number; spoiled: number } || {};
      return (
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-green-100 text-green-800">
            Normal: {counts.normal || 0}
          </span>
          <span className="px-2 py-1 rounded bg-orange-100 text-orange-800">
            Cracked: {counts.cracked || 0}
          </span>
          <span className="px-2 py-1 rounded bg-red-100 text-red-800">
            Spoiled: {counts.spoiled || 0}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "totalCount",
    header: "Total Count",
    cell: ({ row }) => {
      const production = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Egg className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{production.totalCount || 0}</span>
          <span className="text-muted-foreground">eggs</span>
        </div>
      );
    },
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => {
      const production = row.original;
      return (
        <div className="max-w-[200px] truncate text-sm text-muted-foreground">
          {production.notes || "-"}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const production = row.original;
      
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
            <DropdownMenuItem onClick={() => onView(production)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(production)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(production)}
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

export const broilerProductionColumns = (
  onView: (record: any) => void,
  onEdit: (record: any) => void,
  onDelete: (record: any) => void
): ColumnDef<any>[] => [
  {
    accessorKey: "flockId",
    header: "Flock",
    cell: ({ row }) => {
      const production = row.original;
      return (
        <Badge variant="outline" className="font-mono">
          {production.flock?.batchCode || production.flockId}
        </Badge>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const production = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {format(new Date(production.date), "MMM dd, yyyy")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => {
      const production = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Bird className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{production.quantity || 0}</span>
          <span className="text-muted-foreground">birds</span>
        </div>
      );
    },
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => {
      const production = row.original;
      return (
        <div className="max-w-[200px] truncate text-sm text-muted-foreground">
          {production.notes || "-"}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const production = row.original;
      
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
            <DropdownMenuItem onClick={() => onView(production)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(production)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(production)}
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

export const manureProductionColumns = (
  onView: (record: any) => void,
  onEdit: (record: any) => void,
  onDelete: (record: any) => void
): ColumnDef<any>[] => [
  {
    accessorKey: "flockId",
    header: "Flock",
    cell: ({ row }) => {
      const production = row.original;
      return (
        <Badge variant="outline" className="font-mono">
          {production.flock?.batchCode || production.flockId}
        </Badge>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const production = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {format(new Date(production.date), "MMM dd, yyyy")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => {
      const production = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Droplets className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{production.quantity || 0}</span>
          <span className="text-muted-foreground">{production.unit || "bags"}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => {
      const production = row.original;
      return (
        <div className="max-w-[200px] truncate text-sm text-muted-foreground">
          {production.notes || "-"}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const production = row.original;
      
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
            <DropdownMenuItem onClick={() => onView(production)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(production)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(production)}
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

