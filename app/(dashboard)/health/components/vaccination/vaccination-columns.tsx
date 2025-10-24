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
  Syringe,
  FileText,
  Activity,
  Bell,
  Repeat
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
  onUpdateStatus: (vaccination: any) => void,
  getStatusBadge: (status: string) => React.ReactNode,
  t?: any
): ColumnDef<any>[] => [
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
    filterFn: (row, id, value) => {
      const vaccination = row.original;
      const flockId = vaccination.flockId || vaccination.flock?.id || "";
      
      // Handle array values from DataTableFacetedFilter
      if (Array.isArray(value)) {
        return value.includes(flockId);
      }
      
      // Handle string values from regular search
      const flockCode = vaccination.flock?.batchCode || vaccination.flockId || "";
      return flockCode.toLowerCase().includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "status",
    header: t ? t('columns.status') : "Status",
    cell: ({ row }) => {
      const vaccination = row.original;
      const isScheduled = vaccination.isScheduled || vaccination.status === "scheduled";
      const hasReminder = vaccination.reminderEnabled;
      const isRecurring = vaccination.isRecurring;
      
      return (
        <div className="flex items-center gap-2">
          <Badge variant={isScheduled ? "outline" : "default"}>
            {isScheduled ? (t ? t('scheduled') : "Scheduled") : (t ? t('completed') : "Completed")}
          </Badge>
          {hasReminder && isScheduled && (
            <Bell className="h-3 w-3 text-yellow-600" title="Reminder enabled" />
          )}
          {isRecurring && isScheduled && (
            <Repeat className="h-3 w-3 text-blue-600" title="Recurring" />
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const vaccination = row.original;
      const isScheduled = vaccination.isScheduled || vaccination.status === "scheduled";
      const status = isScheduled ? "scheduled" : "completed";
      
      // Handle array values from DataTableFacetedFilter
      if (Array.isArray(value)) {
        return value.includes(status);
      }
      
      return status === value;
    },
  },
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
    accessorKey: "administeredDate",
    header: t ? t('columns.dateAdministered') : "Date",
    cell: ({ row }) => {
      const vaccination = row.original;
      const isScheduled = vaccination.isScheduled || vaccination.status === "scheduled";
      const dateToShow = isScheduled && vaccination.scheduledDate 
        ? new Date(vaccination.scheduledDate)
        : new Date(vaccination.administeredDate);
      
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">
              {EthiopianDateFormatter.formatForTable(dateToShow)}
            </div>
          </div>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      if (!value) return true;
      
      const vaccination = row.original;
      const isScheduled = vaccination.isScheduled || vaccination.status === "scheduled";
      const vaccinationDate = isScheduled && vaccination.scheduledDate 
        ? new Date(vaccination.scheduledDate)
        : new Date(vaccination.administeredDate);
      
      // Handle new filter value structure
      if (typeof value === 'object' && value.date) {
        const { date: filterDate, isMonthFilter } = value;
        
        // Convert both dates to Ethiopian calendar
        const vaccinationEthiopian = EthiopianCalendarUtils.gregorianToEthiopian(vaccinationDate);
        const filterEthiopian = EthiopianCalendarUtils.gregorianToEthiopian(filterDate);
        
        if (isMonthFilter) {
          // Month filtering - match Ethiopian month and year
          return (
            vaccinationEthiopian.month === filterEthiopian.month &&
            vaccinationEthiopian.year === filterEthiopian.year
          );
        } else {
          // Specific date filtering - match Ethiopian date
          return (
            vaccinationEthiopian.day === filterEthiopian.day &&
            vaccinationEthiopian.month === filterEthiopian.month &&
            vaccinationEthiopian.year === filterEthiopian.year
          );
        }
      }
      
      return true;
    },
  },
  {
    accessorKey: "administrationMethod",
    header: t ? t('columns.method') : "Method",
    cell: ({ row }) => {
      const vaccination = row.original;
      if (!vaccination.administrationMethod) {
        return <span className="text-muted-foreground text-sm">N/A</span>;
      }

      const methodMap: Record<string, string> = {
        INJECTION: t ? t('administrationMethods.INJECTION') : "Injection",
        DRINKING_WATER: t ? t('administrationMethods.DRINKING_WATER') : "Drinking Water",
        SPRAY: t ? t('administrationMethods.SPRAY') : "Spray",
        OTHER: t ? t('administrationMethods.OTHER') : "Other"
      };

      return (
        <Badge variant="secondary" className="text-xs">
          {methodMap[vaccination.administrationMethod] || vaccination.administrationMethod}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      const vaccination = row.original;
      const method = vaccination.administrationMethod || "";
      
      // Handle array values from DataTableFacetedFilter
      if (Array.isArray(value)) {
        return value.includes(method);
      }
      
      return method === value;
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
        <div className="font-medium">
          {vaccination.dosage} {vaccination.dosageUnit && <span className="text-muted-foreground text-sm">({vaccination.dosageUnit})</span>}
        </div>
      );
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
      const isScheduled = vaccination.isScheduled || vaccination.status === "scheduled";
      
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
            <DropdownMenuItem onClick={() => onUpdateStatus(vaccination)}>
              <Activity className="mr-2 h-4 w-4" />
              {t ? t('columns.updateStatus') : "Update Status"}
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* View Details */}
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(vaccination.id)}>
              <Eye className="mr-2 h-4 w-4" />
              {t ? t('columns.viewDetails') : "View Details"}
            </DropdownMenuItem>
            
            {/* Edit */}
            <DropdownMenuItem onClick={() => onEdit(vaccination)}>
              <Edit className="mr-2 h-4 w-4" />
              {t ? t('columns.editRecord') : "Edit Record"}
            </DropdownMenuItem>
            
            {/* Delete */}
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
