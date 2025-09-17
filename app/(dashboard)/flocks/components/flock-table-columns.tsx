"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from "lucide-react";
import { Flock } from "./flock-types";
import { format } from "date-fns";

export const flockColumns: ColumnDef<Flock>[] = [
  {
    accessorKey: "batchCode",
    header: "Batch Code",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("batchCode")}</div>
    ),
  },
  {
    accessorKey: "breed",
    header: "Breed",
    cell: ({ row }) => {
      const breed = row.getValue("breed") as string;
      const getBreedBadgeVariant = (breed: string) => {
        switch (breed) {
          case 'broiler': return 'default';
          case 'layer': return 'secondary';
          case 'dual_purpose': return 'outline';
          default: return 'default';
        }
      };
      
      const getBreedLabel = (breed: string) => {
        const breedOptions = [
          { value: 'broiler', label: 'Broiler' },
          { value: 'layer', label: 'Layer' },
          { value: 'dual_purpose', label: 'Dual Purpose' }
        ];
        return breedOptions.find(option => option.value === breed)?.label || breed;
      };

      return (
        <Badge variant={getBreedBadgeVariant(breed)}>
          {getBreedLabel(breed)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => {
      const source = row.getValue("source") as string;
      const getSourceLabel = (source: string) => {
        const sourceOptions = [
          { value: 'hatchery', label: 'Hatchery' },
          { value: 'farm', label: 'Farm' },
          { value: 'imported', label: 'Imported' }
        ];
        return sourceOptions.find(option => option.value === source)?.label || source;
      };
      return <div>{getSourceLabel(source)}</div>;
    },
  },
  {
    accessorKey: "arrivalDate",
    header: "Arrival Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("arrivalDate"));
      return <div>{format(date, 'MMM dd, yyyy')}</div>;
    },
  },
  {
    accessorKey: "age",
    header: "Current Age",
    cell: ({ row }) => {
      const flock = row.original;
      const arrivalDate = new Date(flock.arrivalDate);
      const ageAtArrival = flock.ageInDays || 0;
      const today = new Date();
      const daysSinceArrival = Math.floor((today.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalAgeInDays = ageAtArrival + daysSinceArrival;
      
      const weeks = Math.floor(totalAgeInDays / 7);
      const days = totalAgeInDays % 7;
      
      return (
        <div>
          {weeks > 0 && `${weeks}w`}
          {weeks > 0 && days > 0 && ' '}
          {days > 0 && `${days}d`}
          {totalAgeInDays === 0 && '0d'}
          <span className="text-muted-foreground text-sm">
            ({totalAgeInDays}d)
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "initialCount",
    header: "Initial Count",
    cell: ({ row }) => {
      const count = row.getValue("initialCount") as number;
      return <div>{count.toLocaleString()}</div>;
    },
  },
  {
    accessorKey: "currentCount",
    header: "Current Count",
    cell: ({ row }) => {
      const count = row.getValue("currentCount") as number;
      return <div>{count.toLocaleString()}</div>;
    },
  },
  {
    accessorKey: "populationChange",
    header: "Population Change",
    cell: ({ row }) => {
      const initialCount = row.getValue("initialCount") as number;
      const currentCount = row.getValue("currentCount") as number;
      const change = currentCount - initialCount;
      const percentage = (change / initialCount) * 100;
      
      return (
        <div className="flex items-center space-x-1">
          {change > 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : change < 0 ? (
            <TrendingDown className="h-4 w-4 text-red-600" />
          ) : null}
          <span className={change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : ''}>
            {change > 0 ? '+' : ''}{change.toLocaleString()}
          </span>
          <span className="text-muted-foreground">
            ({percentage > 0 ? '+' : ''}{percentage.toFixed(1)}%)
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "mortalityRate",
    header: "Mortality Rate",
    cell: ({ row }) => {
      const initialCount = row.getValue("initialCount") as number;
      const currentCount = row.getValue("currentCount") as number;
      const mortalityRate = ((initialCount - currentCount) / initialCount) * 100;
      
      const getMortalityStatus = (rate: number) => {
        if (rate > 15) return { status: 'high', color: 'text-red-600', icon: AlertTriangle };
        if (rate > 5) return { status: 'medium', color: 'text-yellow-600', icon: TrendingDown };
        return { status: 'low', color: 'text-green-600', icon: TrendingUp };
      };
      
      const mortalityStatus = getMortalityStatus(mortalityRate);
      const StatusIcon = mortalityStatus.icon;
      
      return (
        <div className="flex items-center space-x-1">
          <StatusIcon className={`h-4 w-4 ${mortalityStatus.color}`} />
          <span className={mortalityStatus.color}>
            {mortalityRate.toFixed(1)}%
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const initialCount = row.getValue("initialCount") as number;
      const currentCount = row.getValue("currentCount") as number;
      const mortalityRate = ((initialCount - currentCount) / initialCount) * 100;
      
      const getMortalityStatus = (rate: number) => {
        if (rate > 15) return { status: 'HIGH RISK', color: 'text-red-600' };
        if (rate > 5) return { status: 'MEDIUM', color: 'text-yellow-600' };
        return { status: 'HEALTHY', color: 'text-green-600' };
      };
      
      const status = getMortalityStatus(mortalityRate);
      
      return (
        <Badge variant={mortalityRate > 15 ? "destructive" : mortalityRate > 5 ? "secondary" : "default"}>
          {status.status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      return <div>Actions will be handled by FlockTable</div>;
    },
  },
];
