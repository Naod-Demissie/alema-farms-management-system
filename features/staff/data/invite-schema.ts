import { z } from "zod";

// Invite status enum
export const inviteStatusSchema = z.enum(["PENDING", "ACCEPTED", "EXPIRED", "CANCELLED"]);

// Invite schema
export const inviteSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(["ADMIN", "VETERINARIAN", "WORKER"]),
  token: z.string(),
  expiresAt: z.date(),
  isUsed: z.boolean(),
  createdById: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  // Relations
  createdBy: z.object({
    id: z.string(),
    name: z.string(),
    role: z.enum(["ADMIN", "VETERINARIAN", "WORKER"]),
  }).nullable().optional(),
});

// Computed status based on isUsed and expiresAt
export const computedInviteStatusSchema = z.enum(["PENDING", "ACCEPTED", "EXPIRED", "CANCELLED"]);

// Schema for creating invites
export const createInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "VETERINARIAN", "WORKER"]),
  createdById: z.string(),
});

// Schema for invite filters
export const inviteFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["PENDING", "ACCEPTED", "EXPIRED", "CANCELLED"]).optional(),
  role: z.enum(["ADMIN", "VETERINARIAN", "WORKER"]).optional(),
  createdById: z.string().optional(),
});

export type Invite = z.infer<typeof inviteSchema>;
export type InviteStatus = z.infer<typeof inviteStatusSchema>;
export type ComputedInviteStatus = z.infer<typeof computedInviteStatusSchema>;
export type CreateInviteData = z.infer<typeof createInviteSchema>;
export type InviteFilters = z.infer<typeof inviteFiltersSchema>;

// Helper function to compute invite status
export function computeInviteStatus(invite: Invite): ComputedInviteStatus {
  if (invite.isUsed) {
    return "ACCEPTED";
  }
  
  if (invite.expiresAt < new Date()) {
    return "EXPIRED";
  }
  
  return "PENDING";
}

// Helper function to get status color
export function getInviteStatusColor(status: ComputedInviteStatus): string {
  const colors = {
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    ACCEPTED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    EXPIRED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  };
  
  return colors[status];
}

// Helper function to get role color
export function getRoleColor(role: string): string {
  const colors = {
    ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    VETERINARIAN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    WORKER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  };
  
  return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800";
}
