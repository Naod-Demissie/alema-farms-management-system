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
  Pill,
  Stethoscope,
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

export const treatmentColumns = (
  onEdit: (treatment: any) => void,
  onDelete: (treatment: any) => void,
  getDiseaseBadge: (disease: string) => React.ReactNode,
  getResponseBadge: (response: string) => React.ReactNode,
  t?: any
): ColumnDef<any>[] => [
  {
    accessorKey: "flockId",
    header: t ? t('columns.flockId') : "Flock ID",
    cell: ({ row }) => {
      const treatment = row.original;
      return (
        <Badge variant="outline" className="font-mono">
          {treatment.flock?.batchCode || treatment.flockId}
        </Badge>
      );
    },
  },
  {
    accessorKey: "diseaseName",
    header: t ? t('columns.diseaseName') : "Disease Name",
    cell: ({ row }) => {
      const treatment = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Stethoscope className="h-4 w-4 text-muted-foreground" />
          <div className="font-medium">{treatment.diseaseName}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "disease",
    header: t ? t('columns.diseaseType') : "Disease Type",
    cell: ({ row }) => {
      const treatment = row.original;
      return getDiseaseBadge(treatment.disease);
    },
  },
  {
    accessorKey: "symptoms",
    header: t ? t('columns.symptoms') : "Symptoms",
    cell: ({ row }) => {
      const treatment = row.original;
      return (
        <div className="max-w-xs">
          <div className="text-sm text-muted-foreground truncate">
            {treatment.symptoms}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "medication",
    header: t ? t('columns.medication') : "Medication",
    cell: ({ row }) => {
      const treatment = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Pill className="h-4 w-4 text-muted-foreground" />
          <div className="font-medium">{treatment.medication}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "dosage",
    header: t ? t('columns.dosage') : "Dosage",
    cell: ({ row }) => {
      const treatment = row.original;
      return (
        <div className="text-sm">
          <div className="font-medium">{treatment.dosage}</div>
          <div className="text-muted-foreground">
            {treatment.frequency} • {treatment.duration}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "startDate",
    header: t ? t('columns.startDate') : "Start Date",
    cell: ({ row }) => {
      const treatment = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="font-medium">
            {EthiopianDateFormatter.formatForTable(new Date(treatment.startDate))}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "endDate",
    header: t ? t('columns.endDate') : "End Date",
    cell: ({ row }) => {
      const treatment = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="font-medium">
            {treatment.endDate ? EthiopianDateFormatter.formatForTable(new Date(treatment.endDate)) : (t ? t('columns.ongoing') : "Ongoing")}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "treatedBy",
    header: t ? t('columns.treatedBy') : "Treated By",
    cell: ({ row }) => {
      const treatment = row.original;
      return (
        <div className="text-sm">
          <div className="font-medium">{treatment.treatedBy?.name || treatment.treatedBy || (t ? t('columns.unknown') : "Unknown")}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "response",
    header: t ? t('columns.response') : "Response",
    cell: ({ row }) => {
      const treatment = row.original;
      return getResponseBadge(treatment.response);
    },
  },
  {
    accessorKey: "notes",
    header: t ? t('columns.notes') : "Notes",
    cell: ({ row }) => {
      const treatment = row.original;
      return (
        <div className="max-w-xs">
          {treatment.notes ? (
            <div className="flex items-center space-x-1">
              <FileText className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground truncate">
                {treatment.notes}
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
      const treatment = row.original;
      
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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(treatment.id)}>
              <Eye className="mr-2 h-4 w-4" />
              {t ? t('columns.viewDetails') : "View Details"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(treatment)}>
              <Edit className="mr-2 h-4 w-4" />
              {t ? t('columns.editRecord') : "Edit Treatment"}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(treatment)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t ? t('columns.deleteRecord') : "Delete Treatment"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
