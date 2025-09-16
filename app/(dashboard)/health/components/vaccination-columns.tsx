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
  onDelete: (id: string) => void,
  getStatusBadge: (status: string) => React.ReactNode
): ColumnDef<any>[] => [
  {
    accessorKey: "vaccineName",
    header: "Vaccine Name",
    cell: ({ row }) => {
      const vaccination = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Syringe className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{vaccination.vaccineName}</div>
            <div className="text-sm text-muted-foreground">
              Lot: {vaccination.lotNumber}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "manufacturer",
    header: "Manufacturer",
    cell: ({ row }) => {
      const vaccination = row.original;
      return (
        <div>
          <div className="font-medium">{vaccination.manufacturer}</div>
          <div className="text-sm text-muted-foreground">
            Batch: {vaccination.batchNumber}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "flockId",
    header: "Flock",
    cell: ({ row }) => {
      const vaccination = row.original;
      return (
        <Badge variant="outline" className="font-mono">
          {vaccination.flockId}
        </Badge>
      );
    },
  },
  {
    accessorKey: "administeredDate",
    header: "Date Administered",
    cell: ({ row }) => {
      const vaccination = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">
              {new Date(vaccination.administeredDate).toLocaleDateString()}
            </div>
            <div className="text-sm text-muted-foreground">
              by {vaccination.administeredBy}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => {
      const vaccination = row.original;
      return (
        <div className="text-center">
          <div className="font-medium">{vaccination.quantity.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">birds</div>
        </div>
      );
    },
  },
  {
    accessorKey: "dosage",
    header: "Dosage & Route",
    cell: ({ row }) => {
      const vaccination = row.original;
      return (
        <div>
          <div className="font-medium">{vaccination.dosage}</div>
          <div className="text-sm text-muted-foreground">
            {vaccination.route}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "expiryDate",
    header: "Expiry Date",
    cell: ({ row }) => {
      const vaccination = row.original;
      const expiryDate = new Date(vaccination.expiryDate);
      const today = new Date();
      const isExpired = expiryDate < today;
      const isExpiringSoon = expiryDate <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      return (
        <div className={`text-sm ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-muted-foreground'}`}>
          {expiryDate.toLocaleDateString()}
          {isExpired && <div className="text-xs text-red-500">Expired</div>}
          {isExpiringSoon && !isExpired && <div className="text-xs text-yellow-500">Expires Soon</div>}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const vaccination = row.original;
      return getStatusBadge(vaccination.status);
    },
  },
  {
    accessorKey: "notes",
    header: "Notes",
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
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(vaccination.id)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(vaccination)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Record
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(vaccination.id)}
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
