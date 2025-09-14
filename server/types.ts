// Shared types and interfaces for staff management system

export interface DateRange {
  start: Date;
  end: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  role?: string;
  isActive?: boolean;
  dateRange?: DateRange;
}

// Staff Invitation Types
export interface CreateInviteData {
  email: string;
  role: 'ADMIN' | 'VETERINARIAN' | 'WORKER';
  createdById: string;
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

// Notification Types
export interface NotificationFilters extends FilterParams {
  isRead?: boolean;
  type?: string;
}

export interface CreateNotificationData {
  staffId: string;
  flockId?: string;
  message: string;
  type?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface SendNotificationData extends CreateNotificationData {
  sendEmail?: boolean;
}

// Analytics Types
export interface AnalyticsFilters extends FilterParams {
  groupBy?: 'day' | 'week' | 'month' | 'year';
  metrics?: string[];
}

export interface ReportFilters extends FilterParams {
  format?: 'pdf' | 'excel' | 'csv';
  includeCharts?: boolean;
}

// Onboarding Types
export interface OnboardingData {
  staffId: string;
  completedTasks: string[];
  documents: string[];
  notes?: string;
}

export interface CreateTaskData {
  title: string;
  description: string;
  category: string;
  required: boolean;
  order: number;
}

// Audit Types
export interface AuditFilters extends FilterParams {
  action?: string;
  staffId?: string;
  dateRange?: DateRange;
}

// File Upload Types
export interface FileUploadData {
  file: File;
  folder: string;
  staffId?: string;
  metadata?: Record<string, any>;
}

// Email Types
export interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
