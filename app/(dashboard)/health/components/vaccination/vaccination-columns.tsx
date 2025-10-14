"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  Syringe,
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

export const vaccinationColumns = (
  onEdit: (vaccination: any) => void,
  onDelete: (vaccination: any) => void,
  getStatusBadge: (status: string) => React.ReactNode,
  t?: any
): ColumnDef<any>[] => [
  {
    accessorKey: "vaccineName",
    header: t ? t('columns.vaccineName') : "Vaccine Name",
    cell: ({ row }) => {
      const vaccination = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Syringe className="h-4 w-4 text-muted-foreground" />
          <div className="font-medium">{vaccination.vaccineName}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "flockId",
    header: t ? t('columns.flock') : "Flock",
    cell: ({ row }) => {
      const vaccination = row.original;
      return (
        <Badge variant="outline" className="font-mono">
          {vaccination.flock?.batchCode || vaccination.flockId}
        </Badge>
      );
    },
  },
  {
    accessorKey: "administeredDate",
    header: t ? t('columns.dateAdministered') : "Date Administered",
    cell: ({ row }) => {
      const vaccination = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">
              {EthiopianDateFormatter.formatForTable(new Date(vaccination.administeredDate))}
            </div>
            <div className="text-sm text-muted-foreground">
              {t ? t('columns.by') : "by"} {vaccination.administeredBy}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: t ? t('columns.quantity') : "Quantity",
    cell: ({ row }) => {
      const vaccination = row.original;
      return (
        <div className="text-center">
          <div className="font-medium">{vaccination.quantity.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">{t ? t('columns.birds') : "birds"}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "dosage",
    header: t ? t('columns.dosage') : "Dosage",
    cell: ({ row }) => {
      const vaccination = row.original;
      return (
        <div className="font-medium">{vaccination.dosage}</div>
      );
    },
  },
  {
    accessorKey: "status",
    header: t ? t('columns.status') : "Status",
    cell: ({ row }) => {
      const vaccination = row.original;
      return getStatusBadge(vaccination.status);
    },
  },
  {
    accessorKey: "notes",
    header: t ? t('columns.notes') : "Notes",
    cell: ({ row }) => {
      const vaccination = row.original;
      return (
        <div className="max-w-xs">
          {vaccination.notes ? (
            <div className="flex items-center space-x-1">
              <FileText className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground truncate">
                {vaccination.notes}
              </span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">{t ? t('columns.noNotes') : "No notes"}</span>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: t ? t('columns.actions') : "Actions",
    cell: ({ row }) => {
      const vaccination = row.original;
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t ? t('columns.actions') : "Actions"}</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(vaccination.id)}>
              <Eye className="mr-2 h-4 w-4" />
              {t ? t('columns.viewDetails') : "View Details"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(vaccination)}>
              <Edit className="mr-2 h-4 w-4" />
              {t ? t('columns.editRecord') : "Edit Record"}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(vaccination)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t ? t('columns.deleteRecord') : "Delete Record"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
