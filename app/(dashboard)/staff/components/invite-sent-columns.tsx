"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { DataTableRowActions } from "@/components/table/data-table-row-actions";
import { Invite, computeInviteStatus, getInviteStatusColor, getRoleColor } from "@/features/staff/data/invite-schema";
import { format } from "date-fns";
import { Mail, Calendar, User, Copy, Send, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InviteSentColumnsProps {
  onResend: (invite: Invite) => void;
  onCancel: (invite: Invite) => void;
  onCopyLink: (invite: Invite) => void;
}

export const createInviteSentColumns = ({
  onResend,
  onCancel,
  onCopyLink,
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
          <div>
            <div className="font-medium">{invite.email}</div>
            <div className="text-sm text-muted-foreground">
              {invite.createdBy?.name || "Unknown"}
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
            {format(date, "MMM dd, yyyy")}
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
            {format(expiresAt, "MMM dd, yyyy")}
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
    cell: ({ row }) => {
      const invite = row.original;
      const status = computeInviteStatus(invite);
      
      return (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopyLink(invite)}
            title="Copy invite link"
          >
            <Copy className="h-4 w-4" />
          </Button>
          
          {status === "PENDING" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onResend(invite)}
                title="Resend invitation"
              >
                <Send className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancel(invite)}
                title="Cancel invitation"
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
