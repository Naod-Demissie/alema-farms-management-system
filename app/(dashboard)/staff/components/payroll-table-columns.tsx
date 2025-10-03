"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { DataTableRowActions } from "@/components/table/data-table-row-actions";
import { format } from "date-fns";
import { Calendar, User } from "lucide-react";

// Payroll record type
export interface PayrollRecord {
  id: string;
  staffId: string;
  salary: number;
  bonus: number | null;
  deductions: number | null;
  paidOn: Date;
  netSalary: number;
  staff: {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    role: string;
  };
}

interface PayrollTableColumnsProps {
  onEdit: (payroll: PayrollRecord) => void;
  onDelete: (payroll: PayrollRecord) => void;
}

export const createPayrollTableColumns = ({
  onEdit,
  onDelete,
}: PayrollTableColumnsProps): ColumnDef<PayrollRecord>[] => [
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
              {staff.role}
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
    id: "staffRole",
    accessorFn: (row) => row.staff.role,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => {
      const role = row.getValue("staffRole") as string;
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
    accessorKey: "paidOn",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Period" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("paidOn") as Date;
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm">
            {format(new Date(date), "MMM dd, yyyy")}
          </div>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const date = new Date(row.getValue(id));
      const filterDate = new Date(value);
      return (
        date.getMonth() === filterDate.getMonth() &&
        date.getFullYear() === filterDate.getFullYear()
      );
    },
  },
  {
    accessorKey: "salary",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Base Salary" />
    ),
    cell: ({ row }) => {
      const salary = row.getValue("salary") as number;
      return (
        <div className="text-sm font-medium">
          {salary.toLocaleString()} ETB
        </div>
      );
    },
  },
  {
    accessorKey: "bonus",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Bonus" />
    ),
    cell: ({ row }) => {
      const bonus = row.getValue("bonus") as number | null;
      return (
        <div className="text-sm">
          {(bonus || 0).toLocaleString()} ETB
        </div>
      );
    },
  },
  {
    accessorKey: "deductions",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Deductions" />
    ),
    cell: ({ row }) => {
      const deductions = row.getValue("deductions") as number | null;
      return (
        <div className="text-sm">
          {(deductions || 0).toLocaleString()} ETB
        </div>
      );
    },
  },
  {
    accessorKey: "netSalary",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Net Salary" />
    ),
    cell: ({ row }) => {
      const netSalary = row.getValue("netSalary") as number;
      return (
        <div className="text-sm font-bold text-primary">
          {netSalary.toLocaleString()} ETB
        </div>
      );
    },
  },
  {
    accessorKey: "paidOn",
    id: "paidDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Paid Date" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("paidOn") as Date;
      return (
        <div className="text-sm">
          {format(new Date(date), "MMM dd, yyyy")}
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
