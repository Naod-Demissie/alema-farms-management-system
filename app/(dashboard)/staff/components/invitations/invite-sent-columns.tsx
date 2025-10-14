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
  t: any; // Translation function
}

export const createInviteSentColumns = ({
  onResend,
  onCancel,
  onCopyLink,
  actionLoading,
  t,
}: InviteSentColumnsProps): ColumnDef<Invite>[] => [
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('invites.columns.email')} />
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
      <DataTableColumnHeader column={column} title={t('invites.columns.role')} />
    ),
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      const roleTranslations: Record<string, string> = {
        ADMIN: t('directory.roles.admin'),
        VETERINARIAN: t('directory.roles.veterinarian'),
        WORKER: t('directory.roles.worker'),
      };
      return (
        <Badge className={getRoleColor(role)}>
          {roleTranslations[role] || role}
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
      <DataTableColumnHeader column={column} title={t('invites.columns.status')} />
    ),
    cell: ({ row }) => {
      const invite = row.original;
      const status = computeInviteStatus(invite);
      
      const statusTranslations: Record<string, string> = {
        PENDING: t('invites.status.pending'),
        ACCEPTED: t('invites.status.accepted'),
        CANCELLED: t('invites.status.cancelled'),
      };
      
      return (
        <div className="flex items-center space-x-2">
          <Badge className={getInviteStatusColor(status)}>
            {statusTranslations[status] || status}
          </Badge>
          {status === "PENDING" && invite.expiresAt < new Date() && (
            <Badge variant="destructive">{t('invites.status.expired')}</Badge>
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
      <DataTableColumnHeader column={column} title={t('invites.columns.sentDate')} />
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
      <DataTableColumnHeader column={column} title={t('invites.columns.expires')} />
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
      <DataTableColumnHeader column={column} title={t('invites.columns.sentBy')} />
    ),
    cell: ({ row }) => {
      const createdBy = row.getValue("createdBy") as { name: string; role: string } | null;
      
      if (!createdBy) {
        return <span className="text-muted-foreground">{t('invites.columns.unknown')}</span>;
      }
      
      const roleTranslations: Record<string, string> = {
        ADMIN: t('directory.roles.admin'),
        VETERINARIAN: t('directory.roles.veterinarian'),
        WORKER: t('directory.roles.worker'),
      };
      
      return (
        <div className="flex items-center space-x-2">
          <User className="h-3 w-3" />
          <div>
            <div className="text-sm font-medium">{createdBy.name}</div>
            <div className="text-xs text-muted-foreground">{roleTranslations[createdBy.role] || createdBy.role}</div>
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
