# Staff Management System - Server Actions

This directory contains all the server actions for the Poultry Farm Management System's staff management functionality. All actions are implemented using Next.js server actions (no API routes).

## File Structure

```
server/
├── types.ts                 # Shared types and interfaces
├── staff.ts                 # Basic staff CRUD operations (existing)
├── staff-invites.ts         # Staff invitation system
├── attendance.ts            # Attendance management
├── payroll.ts               # Payroll management
├── leave.ts                 # Leave management
├── notifications.ts         # Notification system
├── permissions.ts           # Role-based access control
├── analytics.ts             # Analytics and reporting
├── onboarding.ts            # Staff onboarding system
├── files.ts                 # File upload/management
├── email.ts                 # Email service
├── audit.ts                 # Audit logging
└── README.md               # This documentation
```

## Server Actions Overview

### 1. Staff Invitation System (`staff-invites.ts`)

**Purpose**: Manage staff invitations and account creation

**Key Functions**:
- `createInvite(email, role, createdById)` - Send invitation email
- `verifyInviteToken(token)` - Verify invitation token
- `acceptInvite(token, password, additionalData)` - Accept invitation and create account
- `getInvites(createdById?)` - List all invitations (Admin only)
- `cancelInvite(inviteId)` - Cancel invitation
- `resendInvite(inviteId)` - Resend invitation email

**UI Components Needed**:
- Staff invitation dialog
- Invitation acceptance page
- Invitation management table

### 2. Attendance Management (`attendance.ts`)

**Purpose**: Track staff attendance and check-in/check-out

**Key Functions**:
- `checkIn(staffId, location?)` - Staff check-in
- `checkOut(staffId, location?)` - Staff check-out
- `getAttendance(filters)` - Get attendance records with filters
- `getStaffAttendance(staffId, dateRange?)` - Get staff attendance history
- `updateAttendance(attendanceId, data)` - Update attendance record (Admin only)
- `getAttendanceStats(staffId, period)` - Get attendance statistics
- `getAttendanceReports(filters)` - Generate attendance reports

**UI Components Needed**:
- Check-in/Check-out dashboard
- Attendance calendar view
- Attendance history table
- Attendance reports page
- QR code scanner for check-in

### 3. Payroll Management (`payroll.ts`)

**Purpose**: Manage staff payroll and salary calculations

**Key Functions**:
- `createPayroll(data)` - Create payroll record
- `getPayroll(filters)` - List payroll records with filters
- `getStaffPayroll(staffId, dateRange?)` - Get staff payroll history
- `updatePayroll(payrollId, data)` - Update payroll record
- `deletePayroll(payrollId)` - Delete payroll record
- `calculateSalary(staffId, period)` - Calculate salary for staff
- `generatePayrollReport(filters)` - Generate payroll reports

**UI Components Needed**:
- Payroll creation form
- Payroll listing table
- Payroll detail view
- Salary calculation dashboard
- Payroll reports and analytics

### 4. Leave Management (`leave.ts`)

**Purpose**: Handle staff leave requests and approvals

**Key Functions**:
- `createLeaveRequest(data)` - Submit leave request
- `getLeaveRequests(filters)` - List leave requests with filters
- `getStaffLeaveRequests(staffId)` - Get staff leave requests
- `approveLeaveRequest(leaveId, approverId)` - Approve leave request
- `rejectLeaveRequest(leaveId, approverId, reason?)` - Reject leave request
- `cancelLeaveRequest(leaveId)` - Cancel leave request
- `getLeaveBalance(staffId, year?)` - Get leave balance
- `updateLeaveBalance(staffId, data)` - Update leave balance
- `getLeaveCalendar(year, month)` - Get leave calendar
- `getLeaveReports(filters)` - Generate leave reports

**UI Components Needed**:
- Leave request form
- Leave requests table
- Leave approval dashboard
- Leave balance display
- Leave calendar view
- Leave reports

### 5. Notification System (`notifications.ts`)

**Purpose**: Send and manage staff notifications

**Key Functions**:
- `getNotifications(staffId, filters)` - Get staff notifications
- `markNotificationAsRead(notificationId)` - Mark notification as read
- `markAllNotificationsAsRead(staffId)` - Mark all notifications as read
- `sendNotification(data)` - Send notification to staff
- `createNotification(data)` - Create notification (internal use)
- `getUnreadCount(staffId)` - Get unread notification count
- `deleteNotification(notificationId)` - Delete notification
- `sendBulkNotifications(staffIds, message, type?, flockId?)` - Send bulk notifications
- `getNotificationStats(staffId?)` - Get notification statistics

**UI Components Needed**:
- Notification dropdown/bell icon
- Notification list page
- Notification settings
- Real-time notification updates

### 6. Role-Based Access Control (`permissions.ts`)

**Purpose**: Manage user permissions and role-based access

**Key Functions**:
- `getUserPermissions(staffId)` - Get user permissions
- `changeStaffRole(staffId, newRole, changedBy)` - Change staff role
- `getAvailableRoles()` - Get available roles
- `checkPermission(staffId, permission)` - Check specific permission
- `getRolePermissions(role)` - Get role permissions
- `canPerformAction(staffId, action)` - Check if user can perform action
- `getStaffWithPermissions()` - Get staff with their permissions summary
- `validateAccess(staffId, resource, action)` - Validate access to resource

**UI Components Needed**:
- Role management interface
- Permission-based UI rendering
- Access denied pages
- Role assignment dialogs

### 7. Analytics and Reporting (`analytics.ts`)

**Purpose**: Generate analytics and reports for staff management

**Key Functions**:
- `getStaffOverview(dateRange?)` - Get staff overview statistics
- `getAttendanceAnalytics(filters)` - Get attendance analytics
- `getProductivityMetrics(staffId, period)` - Get productivity metrics
- `getLeaveAnalytics(filters)` - Get leave analytics
- `getPayrollAnalytics(filters)` - Get payroll analytics
- `exportStaffReport(filters, format)` - Export staff report

**UI Components Needed**:
- Staff dashboard with key metrics
- Analytics charts and graphs
- Export functionality for reports
- Custom date range selectors

### 8. Staff Onboarding (`onboarding.ts`)

**Purpose**: Manage staff onboarding process

**Key Functions**:
- `completeOnboarding(data)` - Complete onboarding
- `getOnboardingChecklist(staffId)` - Get onboarding tasks
- `markOnboardingTaskComplete(taskId, staffId)` - Mark task as complete
- `getOnboardingProgress(staffId)` - Get onboarding progress
- `createOnboardingTask(data)` - Create onboarding task
- `getAllOnboardingTasks()` - Get all onboarding tasks (Admin only)
- `getStaffOnboardingStatus()` - Get staff onboarding status
- `resetOnboarding(staffId)` - Reset onboarding for staff

**UI Components Needed**:
- Onboarding checklist
- Welcome page for new staff
- Training material access
- Progress tracking

### 9. File Management (`files.ts`)

**Purpose**: Handle file uploads and management

**Key Functions**:
- `uploadFile(data)` - Upload file
- `deleteFile(fileUrl)` - Delete file
- `getFileUrl(fileId)` - Get file URL
- `uploadStaffAvatar(staffId, file)` - Upload staff avatar
- `getFileMetadata(fileId)` - Get file metadata

**UI Components Needed**:
- File upload component
- Avatar upload component
- File management interface

### 10. Email Service (`email.ts`)

**Purpose**: Send various types of emails

**Key Functions**:
- `sendEmail(data)` - Send generic email
- `sendInviteEmail(email, token, role)` - Send invitation email
- `sendPasswordResetEmail(email, token)` - Send password reset email
- `sendNotificationEmail(email, message, type)` - Send notification email
- `sendWelcomeEmail(email, name, role)` - Send welcome email
- `sendLeaveApprovalEmail(email, leaveData)` - Send leave approval email
- `sendPayrollNotificationEmail(email, payrollData)` - Send payroll notification

**UI Components Needed**:
- Email templates
- Email settings
- Email history

### 11. Audit Logging (`audit.ts`)

**Purpose**: Track and log system activities

**Key Functions**:
- `logAction(action, staffId, details)` - Log action
- `getAuditLogs(filters)` - Get audit logs
- `exportAuditLogs(filters)` - Export audit logs
- `getAuditStatistics(dateRange?)` - Get audit statistics
- `getUserActivitySummary(staffId, dateRange?)` - Get user activity summary
- `cleanupAuditLogs(olderThanDays)` - Clean up old audit logs

**UI Components Needed**:
- Audit log viewer
- Activity monitoring dashboard
- Export functionality

## Usage Examples

### Creating a Staff Invitation

```typescript
import { createInvite } from '@/server/staff-invites';

const result = await createInvite({
  email: 'john.doe@example.com',
  role: 'WORKER',
  createdById: 'admin-id'
});
```

### Checking In Staff

```typescript
import { checkIn } from '@/server/attendance';

const result = await checkIn('staff-id', 'Main Office');
```

### Creating Leave Request

```typescript
import { createLeaveRequest } from '@/server/leave';

const result = await createLeaveRequest({
  staffId: 'staff-id',
  leaveType: 'ANNUAL',
  startDate: new Date('2024-02-01'),
  endDate: new Date('2024-02-05'),
  reason: 'Family vacation'
});
```

### Sending Notification

```typescript
import { sendNotification } from '@/server/notifications';

const result = await sendNotification({
  staffId: 'staff-id',
  message: 'Your leave request has been approved',
  type: 'leave',
  priority: 'medium',
  sendEmail: true
});
```

## Security Considerations

1. **Authentication**: All server actions require valid session
2. **Authorization**: Role-based permissions are enforced
3. **Input Validation**: All inputs are validated before processing
4. **Error Handling**: Comprehensive error handling and logging
5. **Audit Trail**: All actions are logged for security purposes

## Database Schema Requirements

The server actions expect the following Prisma models (already defined in schema.prisma):

- `Staff` - Staff members
- `Sessions` - User sessions
- `Accounts` - User accounts
- `Invite` - Staff invitations
- `Attendance` - Attendance records
- `Payroll` - Payroll records
- `LeaveRequest` - Leave requests
- `LeaveBalance` - Leave balances
- `Notifications` - System notifications

## Environment Variables Required

```env
DATABASE_URL=postgresql://...
EMAIL_FROM=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Next Steps

1. Implement the corresponding UI components
2. Add proper error handling and validation
3. Set up email templates
4. Configure file upload storage
5. Implement real-time notifications
6. Add comprehensive testing
7. Set up monitoring and logging

## Notes

- All server actions return a consistent `ApiResponse` format
- Pagination is supported where applicable
- Filtering and searching capabilities are built-in
- Role-based access control is enforced throughout
- Comprehensive error handling and logging
- Ready for production use with proper configuration
