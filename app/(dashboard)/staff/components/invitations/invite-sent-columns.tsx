"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";
import { InviteTableRowActions } from "@/components/table/invite-table-row-actions";
import { Invite, computeInviteStatus, getInviteStatusColor, getRoleColor } from "../../types/invite-schema";
import { format } from "date-fns";
import { Mail, Calendar, User } from "lucide-react";

interface InviteSentColumnsProps {
  onResend: (invite: Invite) => void;
  onCancel: (invite: Invite) => void;
  onCopyLink: (invite: Invite) => void;
  actionLoading?: string | null;
}

export const createInviteSentColumns = ({
  onResend,
  onCancel,
  onCopyLink,
  actionLoading,
}: InviteSentColumnsProps): ColumnDef<Invite>[] => [
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => {
      const invite = row.original;
      return (
        <div className="flex items-center space-x-3">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <div className="font-medium">{invite.email}</div>
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
      return (
        <Badge className={getRoleColor(role)}>
          {role}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const invite = row.original;
      const status = computeInviteStatus(invite);
      
      return (
        <div className="flex items-center space-x-2">
          <Badge className={getInviteStatusColor(status)}>
            {status}
          </Badge>
          {status === "PENDING" && invite.expiresAt < new Date() && (
            <Badge variant="destructive">Expired</Badge>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const invite = row.original;
      const status = computeInviteStatus(invite);
      return value.includes(status);
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sent Date" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;
      return (
        <div className="flex items-center space-x-1">
          <Calendar className="h-3 w-3" />
          <span className="text-sm">
            {EthiopianDateFormatter.formatForTable(new Date(date))}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "expiresAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Expires" />
    ),
    cell: ({ row }) => {
      const expiresAt = row.getValue("expiresAt") as Date;
      const isExpired = expiresAt < new Date();
      
      return (
        <div className="flex items-center space-x-1">
          <Calendar className={`h-3 w-3 ${isExpired ? "text-red-500" : "text-muted-foreground"}`} />
          <span className={`text-sm ${isExpired ? "text-red-500" : ""}`}>
            {EthiopianDateFormatter.formatForTable(new Date(expiresAt))}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "createdBy",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sent By" />
    ),
    cell: ({ row }) => {
      const createdBy = row.getValue("createdBy") as { name: string; role: string } | null;
      
      if (!createdBy) {
        return <span className="text-muted-foreground">Unknown</span>;
      }
      
      return (
        <div className="flex items-center space-x-2">
          <User className="h-3 w-3" />
          <div>
            <div className="text-sm font-medium">{createdBy.name}</div>
            <div className="text-xs text-muted-foreground">{createdBy.role}</div>
          </div>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <InviteTableRowActions
        row={row}
        onResend={onResend}
        onCancel={onCancel}
        onCopyLink={onCopyLink}
        actionLoading={actionLoading}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
