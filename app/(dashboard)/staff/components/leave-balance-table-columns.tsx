"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { DataTableRowActions } from "@/components/table/data-table-row-actions";
import { User, Calendar, Edit, Trash2 } from "lucide-react";

// Leave balance type
export interface LeaveBalance {
  id: string;
  staffId: string;
  year: number;
  totalLeaveDays: number;
  usedLeaveDays: number;
  remainingLeaveDays: number;
  staff: {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    role: string;
  };
}

interface LeaveBalanceTableColumnsProps {
  onEdit: (balance: LeaveBalance) => void;
  onDelete: (balance: LeaveBalance) => void;
}

const roleColors = {
  ADMIN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  VETERINARIAN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  WORKER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

export const createLeaveBalanceTableColumns = ({
  onEdit,
  onDelete,
}: LeaveBalanceTableColumnsProps): ColumnDef<LeaveBalance>[] => [
  {
    id: "staffName",
    accessorFn: (row) => row.staff.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Staff Member" />
    ),
    cell: ({ row }) => {
      const staff = row.original.staff;
      return (
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{staff.name}</div>
            <div className="text-sm text-muted-foreground">
              <Badge className={roleColors[staff.role as keyof typeof roleColors]}>
                {staff.role}
              </Badge>
            </div>
          </div>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const staff = row.original.staff;
      const searchValue = value.toLowerCase();
      return (
        staff.name.toLowerCase().includes(searchValue) ||
        staff.firstName.toLowerCase().includes(searchValue) ||
        staff.lastName.toLowerCase().includes(searchValue) ||
        staff.role.toLowerCase().includes(searchValue)
      );
    },
  },
  {
    accessorKey: "year",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Year" />
    ),
    cell: ({ row }) => {
      const year = row.getValue("year") as number;
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm font-medium">
            {year}
          </div>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "totalLeaveDays",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total Days" />
    ),
    cell: ({ row }) => {
      const days = row.getValue("totalLeaveDays") as number;
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800">
          {days} days
        </Badge>
      );
    },
  },
  {
    accessorKey: "usedLeaveDays",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Used Days" />
    ),
    cell: ({ row }) => {
      const days = row.getValue("usedLeaveDays") as number;
      return (
        <Badge variant="outline" className="bg-orange-100 text-orange-800">
          {days} days
        </Badge>
      );
    },
  },
  {
    accessorKey: "remainingLeaveDays",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Remaining Days" />
    ),
    cell: ({ row }) => {
      const days = row.getValue("remainingLeaveDays") as number;
      const isLow = days <= 5;
      return (
        <Badge variant="outline" className={isLow ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
          {days} days
        </Badge>
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
