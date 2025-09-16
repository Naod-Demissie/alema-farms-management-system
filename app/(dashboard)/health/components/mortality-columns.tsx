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
  Skull,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  AlertTriangle,
  Activity,
  XCircle,
  MapPin,
  User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const mortalityColumns = (
  onEdit: (record: any) => void,
  onDelete: (id: string) => void,
  getCauseBadge: (cause: string) => React.ReactNode,
  getDisposalBadge: (method: string) => React.ReactNode,
  getStatusBadge: (status: string) => React.ReactNode
): ColumnDef<any>[] => [
  {
    accessorKey: "flockId",
    header: "Flock",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <Badge variant="outline" className="font-mono">
          {record.flockId}
        </Badge>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">
              {new Date(record.date).toLocaleDateString()}
            </div>
            <div className="text-sm text-muted-foreground">
              by {record.recordedBy}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "count",
    header: "Deaths",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Skull className="h-4 w-4 text-muted-foreground" />
          <div className="text-center">
            <div className="font-medium text-red-600">{record.count}</div>
            <div className="text-xs text-muted-foreground">birds</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "cause",
    header: "Cause",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div>
          {getCauseBadge(record.cause)}
          <div className="text-xs text-muted-foreground mt-1 truncate max-w-32">
            {record.causeDescription}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "age",
    header: "Age & Weight",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="text-sm">
          <div className="font-medium">{record.age} days</div>
          <div className="text-muted-foreground">{record.weight} kg</div>
        </div>
      );
    },
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="flex items-center space-x-1">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm text-muted-foreground truncate max-w-24">
            {record.location}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "symptoms",
    header: "Symptoms",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="max-w-xs">
          {record.symptoms ? (
            <div className="text-sm text-muted-foreground truncate">
              {record.symptoms}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">No symptoms</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "disposalMethod",
    header: "Disposal",
    cell: ({ row }) => {
      const record = row.original;
      return getDisposalBadge(record.disposalMethod);
    },
  },
  {
    accessorKey: "postMortem",
    header: "Post-Mortem",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="max-w-xs">
          {record.postMortem ? (
            <div className="flex items-center space-x-1">
              <FileText className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground truncate">
                {record.postMortem}
              </span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">No findings</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const record = row.original;
      return getStatusBadge(record.status);
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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(record.id)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(record)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Record
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(record.id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Record
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
