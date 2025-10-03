"use client";

import { format } from "date-fns";
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
  getResponseBadge: (response: string) => React.ReactNode
): ColumnDef<any>[] => [
  {
    accessorKey: "flockId",
    header: "Flock ID",
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
    header: "Disease Name",
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
    header: "Disease Type",
    cell: ({ row }) => {
      const treatment = row.original;
      return getDiseaseBadge(treatment.disease);
    },
  },
  {
    accessorKey: "symptoms",
    header: "Symptoms",
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
    header: "Medication",
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
    header: "Dosage",
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
    header: "Start Date",
    cell: ({ row }) => {
      const treatment = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="font-medium">
            {format(new Date(treatment.startDate), "MMM dd, yyyy")}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "endDate",
    header: "End Date",
    cell: ({ row }) => {
      const treatment = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="font-medium">
            {treatment.endDate ? format(new Date(treatment.endDate), "MMM dd, yyyy") : "Ongoing"}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "treatedBy",
    header: "Treated By",
    cell: ({ row }) => {
      const treatment = row.original;
      return (
        <div className="text-sm">
          <div className="font-medium">{treatment.treatedBy?.name || treatment.treatedBy || "Unknown"}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "response",
    header: "Response",
    cell: ({ row }) => {
      const treatment = row.original;
      return getResponseBadge(treatment.response);
    },
  },
  {
    accessorKey: "notes",
    header: "Notes",
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
            <span className="text-sm text-muted-foreground">No notes</span>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
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
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(treatment.id)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(treatment)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Treatment
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(treatment)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Treatment
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
