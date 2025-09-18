"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Phone,
  MapPin,
  Building2,
  User,
  Calendar,
  CheckCircle,
  XCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const supplierColumns = (
  onView: (record: any) => void,
  onEdit: (record: any) => void,
  onDelete: (record: any) => void,
  getStatusBadge: (isActive: boolean) => React.ReactNode
): ColumnDef<any>[] => [
  {
    accessorKey: "name",
    header: "Supplier Name",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{record.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "contactName",
    header: "Contact Person",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{record.contactName || "N/A"}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => {
      const record = row.original;
      return record.phone ? (
        <div className="flex items-center space-x-1">
          <Phone className="h-3 w-3 text-muted-foreground" />
          <a 
            href={`tel:${record.phone}`}
            className="text-blue-600 hover:underline text-sm"
          >
            {record.phone}
          </a>
        </div>
      ) : (
        <span className="text-muted-foreground">N/A</span>
      );
    },
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => {
      const record = row.original;
      return record.address ? (
        <div className="flex items-center space-x-1">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm truncate max-w-48" title={record.address}>
            {record.address}
          </span>
        </div>
      ) : (
        <span className="text-muted-foreground">N/A</span>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const record = row.original;
      return getStatusBadge(record.isActive);
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm">
            {new Date(record.createdAt).toLocaleDateString()}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div className="text-sm">
          <div className="truncate max-w-48" title={record.notes}>
            {record.notes || "N/A"}
          </div>
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
            <DropdownMenuItem onClick={() => onView(record)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(record)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Supplier
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(record)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Supplier
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
