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
  Pill,
  Stethoscope,
  FileText,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const treatmentColumns = (
  onEdit: (treatment: any) => void,
  onDelete: (id: string) => void,
  getDiseaseBadge: (disease: string) => React.ReactNode,
  getResponseBadge: (response: string) => React.ReactNode,
  getStatusBadge: (status: string) => React.ReactNode,
  onResponseUpdate: (id: string, response: string) => void
): ColumnDef<any>[] => [
  {
    accessorKey: "diseaseName",
    header: "Disease & Classification",
    cell: ({ row }) => {
      const treatment = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Stethoscope className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{treatment.diseaseName}</div>
            <div className="flex items-center space-x-2 mt-1">
              {getDiseaseBadge(treatment.disease)}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "flockId",
    header: "Flock",
    cell: ({ row }) => {
      const treatment = row.original;
      return (
        <Badge variant="outline" className="font-mono">
          {treatment.flockId}
        </Badge>
      );
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
    header: "Medication & Dosage",
    cell: ({ row }) => {
      const treatment = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Pill className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{treatment.medication}</div>
            <div className="text-sm text-muted-foreground">
              {treatment.dosage}
            </div>
            <div className="text-xs text-muted-foreground">
              {treatment.frequency} • {treatment.duration}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "startDate",
    header: "Treatment Period",
    cell: ({ row }) => {
      const treatment = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">
              {new Date(treatment.startDate).toLocaleDateString()}
            </div>
            {treatment.endDate && (
              <div className="text-sm text-muted-foreground">
                to {new Date(treatment.endDate).toLocaleDateString()}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              by {treatment.treatedBy}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "response",
    header: "Response",
    cell: ({ row }) => {
      const treatment = row.original;
      return (
        <div className="space-y-2">
          {getResponseBadge(treatment.response)}
          {treatment.status === "in_progress" && (
            <Select
              value={treatment.response}
              onValueChange={(value) => onResponseUpdate(treatment.id, value)}
            >
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="improved">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Improved</span>
                  </div>
                </SelectItem>
                <SelectItem value="no_change">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-yellow-600" />
                    <span>No Change</span>
                  </div>
                </SelectItem>
                <SelectItem value="worsened">
                  <div className="flex items-center space-x-1">
                    <XCircle className="w-3 h-3 text-red-600" />
                    <span>Worsened</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const treatment = row.original;
      return getStatusBadge(treatment.status);
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
              onClick={() => onDelete(treatment.id)}
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
