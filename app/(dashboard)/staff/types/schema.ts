import { z } from "zod";

// Staff role enum
export const staffRoleSchema = z.enum(["ADMIN", "VETERINARIAN", "WORKER"]);

// Staff schema
export const staffSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  name: z.string(),
  email: z.string().email().optional(), // Email is optional for non-system users
  emailVerified: z.boolean().optional(),
  image: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  role: staffRoleSchema,
  isSystemUser: z.boolean(), // True for Admin/Vet, false for workers
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Schema for creating staff (with optional email)
export const createStaffSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  image: z.string().optional(),
  role: staffRoleSchema,
  isSystemUser: z.boolean(),
});

export const staffListSchema = z.array(staffSchema);

export type Staff = z.infer<typeof staffSchema>;
export type StaffRole = z.infer<typeof staffRoleSchema>;
export type CreateStaff = z.infer<typeof createStaffSchema>;

