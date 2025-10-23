"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";
import { EthiopianCalendarUtils } from "@/lib/ethiopian-calendar";
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
  FileText,
  XCircle,
  CheckCircle,
  AlertCircle,
  Activity
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
  onUpdateStatus: (treatment: any) => void,
  getDiseaseBadge: (disease: string) => React.ReactNode,
  t?: any
): ColumnDef<any>[] => [
  {
    accessorKey: "flockId",
    header: t ? t('columns.flockId') : "Flock ID",
    cell: ({ row }) => {
      const treatment = row.original;
      const hasSickBirds = (treatment.stillSickCount || 0) > 0;
      const hasDeceasedBirds = (treatment.deceasedCount || 0) > 0;
      
      return (
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="font-mono">
            {treatment.flock?.batchCode || treatment.flockId}
          </Badge>
          {hasSickBirds && (
            <AlertCircle className="h-4 w-4 text-yellow-500" title="Has sick birds" />
          )}
          {hasDeceasedBirds && (
            <XCircle className="h-4 w-4 text-red-500" title="Has deceased birds" />
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const treatment = row.original;
      const flockId = treatment.flockId || treatment.flock?.id || "";
      
      // Handle array values from DataTableFacetedFilter
      if (Array.isArray(value)) {
        return value.includes(flockId);
      }
      
      // Handle string values from regular search
      const flockCode = treatment.flock?.batchCode || treatment.flockId || "";
      return flockCode.toLowerCase().includes(value.toLowerCase());
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
    accessorKey: "diseasedBirdsCount",
    header: t ? t('columns.diseasedBirdsCount') : "Diseased Birds",
    cell: ({ row }) => {
      const treatment = row.original;
      return (
        <div className="flex items-center space-x-2">
          <div className="font-medium text-red-600">
            {treatment.diseasedBirdsCount || 0}
          </div>
          <span className="text-sm text-muted-foreground">birds</span>
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
    filterFn: (row, id, value) => {
      if (!value) return true;
      
      const treatment = row.original;
      const treatmentDate = new Date(treatment.startDate);
      
      // Handle new filter value structure
      if (typeof value === 'object' && value.date) {
        const { date: filterDate, isMonthFilter } = value;
        
        // Convert both dates to Ethiopian calendar
        const treatmentEthiopian = EthiopianCalendarUtils.gregorianToEthiopian(treatmentDate);
        const filterEthiopian = EthiopianCalendarUtils.gregorianToEthiopian(filterDate);
        
        if (isMonthFilter) {
          // Month filtering - match Ethiopian month and year
          return (
            treatmentEthiopian.month === filterEthiopian.month &&
            treatmentEthiopian.year === filterEthiopian.year
          );
        } else {
          // Specific date filtering - match Ethiopian date
          return (
            treatmentEthiopian.day === filterEthiopian.day &&
            treatmentEthiopian.month === filterEthiopian.month &&
            treatmentEthiopian.year === filterEthiopian.year
          );
        }
      }
      
      return true;
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
    accessorKey: "deceasedCount",
    header: t ? t('columns.deceasedCount') : "Deceased",
    cell: ({ row }) => {
      const treatment = row.original;
      return (
        <div className="flex items-center space-x-2">
          <XCircle className="h-4 w-4 text-red-500" />
          <div className="font-medium text-red-600">
            {treatment.deceasedCount || 0}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "recoveredCount",
    header: t ? t('columns.recoveredCount') : "Recovered",
    cell: ({ row }) => {
      const treatment = row.original;
      return (
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <div className="font-medium text-green-600">
            {treatment.recoveredCount || 0}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "stillSickCount",
    header: t ? t('columns.stillSickCount') : "Still Sick",
    cell: ({ row }) => {
      const treatment = row.original;
      return (
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <div className="font-medium text-yellow-600">
            {treatment.stillSickCount || 0}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "lastStatusUpdate",
    header: t ? t('columns.lastStatusUpdate') : "Last Update",
    cell: ({ row }) => {
      const treatment = row.original;
      return (
        <div className="text-sm">
          {treatment.lastStatusUpdate ? (
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="font-medium">
                {EthiopianDateFormatter.formatForTable(new Date(treatment.lastStatusUpdate))}
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">No updates</span>
          )}
        </div>
      );
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
            
            {/* Update Status */}
            <DropdownMenuItem onClick={() => {
              console.log("Update Status clicked for treatment:", treatment);
              onUpdateStatus(treatment);
            }}>
              <Activity className="mr-2 h-4 w-4" />
              {t ? t('columns.updateStatus') : "Update Status"}
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* View Details */}
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(treatment.id)}>
              <Eye className="mr-2 h-4 w-4" />
              {t ? t('columns.viewDetails') : "View Details"}
            </DropdownMenuItem>
            
            {/* Edit */}
            <DropdownMenuItem onClick={() => onEdit(treatment)}>
              <Edit className="mr-2 h-4 w-4" />
              {t ? t('columns.editRecord') : "Edit"}
            </DropdownMenuItem>
            
            {/* Delete */}
            <DropdownMenuItem 
              onClick={() => onDelete(treatment)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t ? t('columns.deleteRecord') : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
