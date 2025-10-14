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
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";

const eggGradeColors = {
  normal: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  cracked: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  spoiled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
};


export const eggProductionColumns = (
  onView: (record: any) => void,
  onEdit: (record: any) => void,
  onDelete: (record: any) => void,
  t: any
): ColumnDef<any>[] => [
  {
    accessorKey: "flockId",
    header: t('columns.flock'),
    cell: ({ row }) => {
      const production = row.original;
      return (
        <Badge variant="outline" className="font-mono">
          {production.flock?.batchCode || production.flockId}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      const production = row.original;
      const flockCode = production.flock?.batchCode || production.flockId || "";
      return flockCode.toLowerCase().includes(value.toLowerCase());
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
            {EthiopianDateFormatter.formatForTable(new Date(production.date))}
          </span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      if (!value) return true;
      const production = row.original;
      const productionDate = new Date(production.date);
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
          productionDate.getFullYear() === filterDate.getFullYear() &&
          productionDate.getMonth() === filterDate.getMonth() &&
          productionDate.getDate() === filterDate.getDate()
        );
      } else {
        // Month filtering - match month and year
        return (
          productionDate.getMonth() === filterDate.getMonth() &&
          productionDate.getFullYear() === filterDate.getFullYear()
        );
      }
    },
  },
  {
    accessorKey: "gradeCounts",
    header: t('columns.gradeBreakdown'),
    cell: ({ row }) => {
      const production = row.original;
      const counts = production.gradeCounts as { normal: number; cracked: number; spoiled: number } || {};
      return (
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-green-100 text-green-800">
            {t('grades.normal')}: {counts.normal || 0}
          </span>
          <span className="px-2 py-1 rounded bg-orange-100 text-orange-800">
            {t('grades.cracked')}: {counts.cracked || 0}
          </span>
          <span className="px-2 py-1 rounded bg-red-100 text-red-800">
            {t('grades.spoiled')}: {counts.spoiled || 0}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "totalCount",
    header: t('columns.totalCount'),
    cell: ({ row }) => {
      const production = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Egg className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{production.totalCount || 0}</span>
          <span className="text-muted-foreground">{t('columns.eggs')}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "notes",
    header: t('columns.notes'),
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
    header: t('columns.actions'),
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
            <DropdownMenuLabel>{t('actions.label')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onView(production)}>
              <Eye className="h-4 w-4 mr-2" />
              {t('actions.viewDetails')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(production)}>
              <Edit className="h-4 w-4 mr-2" />
              {t('actions.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(production)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('actions.delete')}
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
  onDelete: (record: any) => void,
  t: any
): ColumnDef<any>[] => [
  {
    accessorKey: "flockId",
    header: t('columns.flock'),
    cell: ({ row }) => {
      const production = row.original;
      return (
        <Badge variant="outline" className="font-mono">
          {production.flock?.batchCode || production.flockId}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      const production = row.original;
      const flockCode = production.flock?.batchCode || production.flockId || "";
      return flockCode.toLowerCase().includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "date",
    header: t('columns.date'),
    cell: ({ row }) => {
      const production = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {EthiopianDateFormatter.formatForTable(new Date(production.date))}
          </span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      if (!value) return true;
      const production = row.original;
      const productionDate = new Date(production.date);
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
          productionDate.getFullYear() === filterDate.getFullYear() &&
          productionDate.getMonth() === filterDate.getMonth() &&
          productionDate.getDate() === filterDate.getDate()
        );
      } else {
        // Month filtering - match month and year
        return (
          productionDate.getMonth() === filterDate.getMonth() &&
          productionDate.getFullYear() === filterDate.getFullYear()
        );
      }
    },
  },
  {
    accessorKey: "quantity",
    header: t('columns.quantity'),
    cell: ({ row }) => {
      const production = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Bird className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{production.quantity || 0}</span>
          <span className="text-muted-foreground">{t('columns.birds')}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "notes",
    header: t('columns.notes'),
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
    header: t('columns.actions'),
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
            <DropdownMenuLabel>{t('actions.label')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onView(production)}>
              <Eye className="h-4 w-4 mr-2" />
              {t('actions.viewDetails')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(production)}>
              <Edit className="h-4 w-4 mr-2" />
              {t('actions.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(production)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('actions.delete')}
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
  onDelete: (record: any) => void,
  t: any
): ColumnDef<any>[] => [
  {
    accessorKey: "flockId",
    header: t('columns.flock'),
    cell: ({ row }) => {
      const production = row.original;
      return (
        <Badge variant="outline" className="font-mono">
          {production.flock?.batchCode || production.flockId}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      const production = row.original;
      const flockCode = production.flock?.batchCode || production.flockId || "";
      return flockCode.toLowerCase().includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "date",
    header: t('columns.date'),
    cell: ({ row }) => {
      const production = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {EthiopianDateFormatter.formatForTable(new Date(production.date))}
          </span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      if (!value) return true;
      const production = row.original;
      const productionDate = new Date(production.date);
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
          productionDate.getFullYear() === filterDate.getFullYear() &&
          productionDate.getMonth() === filterDate.getMonth() &&
          productionDate.getDate() === filterDate.getDate()
        );
      } else {
        // Month filtering - match month and year
        return (
          productionDate.getMonth() === filterDate.getMonth() &&
          productionDate.getFullYear() === filterDate.getFullYear()
        );
      }
    },
  },
  {
    accessorKey: "quantity",
    header: t('columns.quantity'),
    cell: ({ row }) => {
      const production = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Droplets className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{production.quantity || 0}</span>
          <span className="text-muted-foreground">{production.unit || t('columns.bags')}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "notes",
    header: t('columns.notes'),
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
    header: t('columns.actions'),
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
            <DropdownMenuLabel>{t('actions.label')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onView(production)}>
              <Eye className="h-4 w-4 mr-2" />
              {t('actions.viewDetails')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(production)}>
              <Edit className="h-4 w-4 mr-2" />
              {t('actions.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(production)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('actions.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

