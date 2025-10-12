"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { DataTableRowActions } from "@/components/table/data-table-row-actions";
import { Staff } from "../../types/schema";
import { format } from "date-fns";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";
import { Mail, Phone } from "lucide-react";

interface StaffDirectoryColumnsProps {
  onEdit: (staff: Staff) => void;
  onView: (staff: Staff) => void;
  onDelete: (staff: Staff) => void;
}

export const createStaffDirectoryColumns = ({
  onEdit,
  onView,
  onDelete,
}: StaffDirectoryColumnsProps): ColumnDef<Staff>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Staff" />
    ),
    cell: ({ row }) => {
      const staff = row.original;
      return (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={staff.image || ""} alt={staff.name} />
            <AvatarFallback>
              {staff.firstName.charAt(0)}
              {staff.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{staff.name}</div>
            <div className="text-sm text-muted-foreground">
              {staff.email || "No email"}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      const roleColors = {
        ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        VETERINARIAN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        WORKER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      };

      return (
        <Badge className={roleColors[role as keyof typeof roleColors]}>
          {role}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "contact",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contact" />
    ),
    cell: ({ row }) => {
      const staff = row.original;
      return (
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <Mail className="mr-2 h-3 w-3" />
            {staff.email || "No email"}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Phone className="mr-2 h-3 w-3" />
            {staff.phoneNumber || "No phone"}
          </div>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "isActive",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean;

      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      const isActive = row.getValue(id) as boolean;

      if (isActive && value.includes("active")) return true;
      if (!isActive && value.includes("inactive")) return true;

      return false;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Joined Date" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as string;
      return (
        <div className="text-sm">
          {EthiopianDateFormatter.formatForTable(new Date(date))}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
