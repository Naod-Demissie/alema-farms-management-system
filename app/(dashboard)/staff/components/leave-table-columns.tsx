"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { DataTableRowActions } from "@/components/table/data-table-row-actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar, User, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

// Leave request type
export interface LeaveRequest {
  id: string;
  staffId: string;
  leaveType: string;
  startDate: Date | string;
  endDate: Date | string;
  reason: string | null;
  status: string;
  approvedBy: string | null;
  staff: {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    role: string;
  };
  approver: {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    role: string;
  } | null;
  leaveDays?: number;
}

interface LeaveTableColumnsProps {
  onEdit: (leaveRequest: LeaveRequest) => void;
  onDelete: (leaveRequest: LeaveRequest) => void;
  onApprove?: (leaveRequest: LeaveRequest) => void;
  onReject?: (leaveRequest: LeaveRequest) => void;
  onStatusChange?: (leaveRequest: LeaveRequest, newStatus: string) => void;
  currentUserRole?: string;
}

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

const leaveTypeColors = {
  ANNUAL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  SICK: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  MATERNITY: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  PATERNITY: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  CASUAL: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  UNPAID: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

export const createLeaveTableColumns = ({
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onStatusChange,
  currentUserRole = "WORKER",
}: LeaveTableColumnsProps): ColumnDef<LeaveRequest>[] => [
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
    accessorKey: "leaveType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Leave Type" />
    ),
    cell: ({ row }) => {
      const leaveType = row.getValue("leaveType") as string;
      return (
        <Badge className={leaveTypeColors[leaveType as keyof typeof leaveTypeColors]}>
          {leaveType}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "startDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Start Date" />
    ),
    cell: ({ row }) => {
      const dateValue = row.getValue("startDate");
      const date = new Date(dateValue as string | Date);
      const isValidDate = date && !isNaN(date.getTime());
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm">
            {isValidDate ? format(date, "MMM dd, yyyy") : "Invalid date"}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "endDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="End Date" />
    ),
    cell: ({ row }) => {
      const dateValue = row.getValue("endDate");
      const date = new Date(dateValue as string | Date);
      const isValidDate = date && !isNaN(date.getTime());
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm">
            {isValidDate ? format(date, "MMM dd, yyyy") : "Invalid date"}
          </div>
        </div>
      );
    },
  },
  {
    id: "leaveDays",
    accessorFn: (row) => {
      const startDate = new Date(row.startDate as string | Date);
      const endDate = new Date(row.endDate as string | Date);
      const isValidStart = !isNaN(startDate.getTime());
      const isValidEnd = !isNaN(endDate.getTime());
      
      if (!isValidStart || !isValidEnd) {
        return 0;
      }
      
      return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Days" />
    ),
    cell: ({ row }) => {
      const startDate = new Date(row.original.startDate as string | Date);
      const endDate = new Date(row.original.endDate as string | Date);
      const isValidStart = !isNaN(startDate.getTime());
      const isValidEnd = !isNaN(endDate.getTime());
      
      if (!isValidStart || !isValidEnd) {
        return (
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm font-medium text-red-500">
              Invalid dates
            </div>
          </div>
        );
      }
      
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return (
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm font-medium">
            {days} {days === 1 ? 'day' : 'days'}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row, table }) => {
      const status = row.getValue("status") as string;
      const statusIcons = {
        PENDING: <Clock className="h-3 w-3" />,
        APPROVED: <CheckCircle className="h-3 w-3" />,
        REJECTED: <XCircle className="h-3 w-3" />,
        CANCELLED: <AlertCircle className="h-3 w-3" />,
      };

      const onStatusChange = (table.options.meta as any)?.onStatusChange;

      if (onStatusChange) {
        return (
          <Select
            value={status}
            onValueChange={(newStatus) => onStatusChange(row.original, newStatus)}
          >
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue>
                <div className="flex items-center space-x-1">
                  {statusIcons[status as keyof typeof statusIcons]}
                  <span>{status}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3" />
                  <span>Pending</span>
                </div>
              </SelectItem>
              <SelectItem value="APPROVED">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3" />
                  <span>Approved</span>
                </div>
              </SelectItem>
              <SelectItem value="REJECTED">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-3 w-3" />
                  <span>Rejected</span>
                </div>
              </SelectItem>
              <SelectItem value="CANCELLED">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-3 w-3" />
                  <span>Cancelled</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        );
      }

      return (
        <Badge className={statusColors[status as keyof typeof statusColors]}>
          <div className="flex items-center space-x-1">
            {statusIcons[status as keyof typeof statusIcons]}
            <span>{status}</span>
          </div>
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "reason",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reason" />
    ),
    cell: ({ row }) => {
      const reason = row.getValue("reason") as string | null;
      return (
        <div className="text-sm max-w-[200px] truncate">
          {reason || "No reason provided"}
        </div>
      );
    },
  },
  {
    id: "approver",
    accessorFn: (row) => row.approver?.name || "N/A",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Approved By" />
    ),
    cell: ({ row }) => {
      const approver = row.original.approver;
      return (
        <div className="text-sm">
          {approver ? approver.name : "N/A"}
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
        additionalActions={
          currentUserRole === "ADMIN" && row.original.status === "PENDING" ? [
            {
              label: "Approve",
              onClick: () => onApprove?.(row.original),
              icon: CheckCircle,
            },
            {
              label: "Reject",
              onClick: () => onReject?.(row.original),
              icon: XCircle,
            },
          ] : []
        }
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
