// Staff management types

import { FilterParams, DateRange } from "@/lib/types";

// Staff Invitation Types
export interface CreateInviteData {
  email: string;
  role: 'ADMIN' | 'VETERINARIAN' | 'WORKER';
}

export interface InviteVerificationData {
  token: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

// Attendance Types
export interface AttendanceFilters extends FilterParams {
  staffId?: string;
  status?: string;
  location?: string;
}

export interface CreateAttendanceData {
  staffId: string;
  checkInTime: Date;
  location?: string;
}

export interface UpdateAttendanceData {
  checkInTime?: Date;
  checkOutTime?: Date;
  status?: string;
  location?: string;
  notes?: string;
}

// Payroll Types
export interface PayrollFilters extends FilterParams {
  staffId?: string;
  paidOn?: DateRange;
}

export interface CreatePayrollData {
  staffId: string;
  salary: number;
  bonus?: number;
  deductions?: number;
  paidOn: Date;
  period: string;
  notes?: string;
}

export interface UpdatePayrollData {
  salary?: number;
  bonus?: number;
  deductions?: number;
  paidOn?: Date;
  notes?: string;
}

// Leave Types
export interface LeaveFilters extends FilterParams {
  staffId?: string;
  leaveType?: string;
  status?: string;
  approverId?: string;
}

export interface CreateLeaveRequestData {
  staffId: string;
  leaveType: 'SICK' | 'ANNUAL' | 'MATERNITY' | 'PATERNITY' | 'CASUAL' | 'UNPAID';
  startDate: Date;
  endDate: Date;
  reason?: string;
}

export interface LeaveBalanceData {
  staffId: string;
  year: number;
  totalLeaveDays: number;
  usedLeaveDays?: number;
}

