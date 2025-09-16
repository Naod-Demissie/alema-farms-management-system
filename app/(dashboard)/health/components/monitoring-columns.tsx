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
  Weight,
  Activity,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Thermometer,
  Droplets,
  Utensils
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const monitoringColumns = (
  onEdit: (record: any) => void,
  onDelete: (id: string) => void,
  getBodyConditionBadge: (condition: string) => React.ReactNode,
  getBehaviorBadge: (behavior: string) => React.ReactNode,
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
    accessorKey: "avgWeight",
    header: "Weight & Condition",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Weight className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{record.avgWeight} kg</div>
            <div className="flex items-center space-x-1 mt-1">
              {getBodyConditionBadge(record.bodyCondition)}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "behavior",
    header: "Behavior",
    cell: ({ row }) => {
      const record = row.original;
      return getBehaviorBadge(record.behavior);
    },
  },
  {
    accessorKey: "environmental",
    header: "Environment",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="space-y-1">
          <div className="flex items-center space-x-1 text-sm">
            <Thermometer className="h-3 w-3 text-muted-foreground" />
            <span>{record.temperature}°C</span>
          </div>
          <div className="flex items-center space-x-1 text-sm">
            <Droplets className="h-3 w-3 text-muted-foreground" />
            <span>{record.humidity}%</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "consumption",
    header: "Feed & Water",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="space-y-1">
          <div className="flex items-center space-x-1 text-sm">
            <Utensils className="h-3 w-3 text-muted-foreground" />
            <span>{record.feedConsumption}kg</span>
          </div>
          <div className="flex items-center space-x-1 text-sm">
            <Droplets className="h-3 w-3 text-muted-foreground" />
            <span>{record.waterConsumption}L</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "mortalityCount",
    header: "Mortality",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="text-center">
          <div className={`font-medium ${record.mortalityCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {record.mortalityCount}
          </div>
          <div className="text-xs text-muted-foreground">deaths</div>
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
    accessorKey: "observations",
    header: "Observations",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="max-w-xs">
          {record.observations ? (
            <div className="flex items-center space-x-1">
              <FileText className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground truncate">
                {record.observations}
              </span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">No observations</span>
          )}
        </div>
      );
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
