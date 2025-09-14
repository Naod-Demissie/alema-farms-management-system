"use client";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { Copy, Send, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Invite, computeInviteStatus } from "@/features/staff/data/invite-schema";

interface InviteTableRowActionsProps {
  row: Row<Invite>;
  onResend: (invite: Invite) => void;
  onCancel: (invite: Invite) => void;
  onCopyLink: (invite: Invite) => void;
  actionLoading?: string | null;
}

export function InviteTableRowActions({
  row,
  onResend,
  onCancel,
  onCopyLink,
  actionLoading,
}: InviteTableRowActionsProps) {
  const invite = row.original;
  const status = computeInviteStatus(invite);
  const isLoading = actionLoading === invite.id;

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
            disabled={isLoading}
            onClick={(e) => e.stopPropagation()}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <DotsHorizontalIcon className="h-4 w-4" />
            )}
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onCopyLink(invite);
            }}
            disabled={isLoading}
          >
            <Copy size={16} className="mr-2" />
            Copy Link
          </DropdownMenuItem>
          
          {status === "PENDING" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onResend(invite);
                }}
                disabled={isLoading}
              >
                <Send size={16} className="mr-2" />
                Resend Invitation
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(invite);
                }}
                disabled={isLoading}
                className="text-red-500 focus:text-red-500"
              >
                <XCircle size={16} className="mr-2" />
                Cancel Invitation
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
