"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  User,
  CalendarDays
} from "lucide-react";
import { format } from "date-fns";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";
import { EthiopianCalendarUtils } from "@/lib/ethiopian-calendar";
import { cn } from "@/lib/utils";
import { 
  getLeaveRequests, 
  createLeaveRequest, 
  updateLeaveRequest, 
  deleteLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  getAllLeaveBalances,
  createLeaveBalance,
  updateLeaveBalance,
  deleteLeaveBalance
} from "@/app/(dashboard)/staff/server/leave";
import { getStaff as getStaffList } from "@/app/(dashboard)/staff/server/staff";
import { CreateLeaveRequestData } from "../../types/types";
import { LeaveTable } from "./leave-table";
import { createLeaveTableColumns, LeaveRequest } from "./leave-table-columns";
import { LeaveBalanceTable } from "./leave-balance-table";
import { createLeaveBalanceTableColumns, LeaveBalance } from "./leave-balance-table-columns";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { useTranslations } from 'next-intl';

// Types
interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
}

export function LeaveManagement() {
  const t = useTranslations('staff');
  const [activeTab, setActiveTab] = useState("requests");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  
  // Real data state
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | 'approve' | 'reject' | 'deleteBalance' | null;
    leaveRequest?: LeaveRequest | null;
    leaveBalance?: LeaveBalance | null;
  }>({
    open: false,
    type: null,
    leaveRequest: null,
    leaveBalance: null,
  });
  
  // Form state for create/edit
  const [formData, setFormData] = useState({
    staffId: "",
    leaveType: "ANNUAL",
    startDate: EthiopianDateFormatter.getCurrentEthiopianDate().toISOString().split('T')[0],
    endDate: EthiopianDateFormatter.getCurrentEthiopianDate().toISOString().split('T')[0],
    reason: ""
  });

  // Leave balance form state
  const [balanceFormData, setBalanceFormData] = useState({
    staffId: "",
    year: EthiopianCalendarUtils.gregorianToEthiopian(new Date()).year,
    totalLeaveDays: 25,
    usedLeaveDays: 0
  });

  // Dialog states
  const [isCreateBalanceDialogOpen, setIsCreateBalanceDialogOpen] = useState(false);
  const [isEditBalanceDialogOpen, setIsEditBalanceDialogOpen] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<LeaveBalance | null>(null);

  // Fetch leave requests
  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getLeaveRequests();
      if (response.success) {
        setLeaveRequests(response.data || []);
      } else {
        setError(response.message || "Failed to fetch leave requests");
      }
    } catch (err) {
      console.error("Error fetching leave requests:", err);
      setError("Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  };

  // Fetch leave balances
  const fetchLeaveBalances = async () => {
    try {
      setBalanceLoading(true);
      const response = await getAllLeaveBalances();
      if (response.success) {
        setLeaveBalances(response.data || []);
      } else {
        setError(response.message || "Failed to fetch leave balances");
      }
    } catch (err) {
      setError("Failed to fetch leave balances");
    } finally {
      setBalanceLoading(false);
    }
  };

  // Fetch staff list
  const fetchStaffList = async () => {
    try {
      const response = await getStaffList();
      if (response.success) {
        setStaffList(response.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch staff list:", err);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchLeaveRequests();
    fetchLeaveBalances();
    fetchStaffList();
  }, []);

  const leaveStats = {
    totalRequests: leaveRequests.length,
    pendingRequests: leaveRequests.filter(r => r.status === "PENDING").length,
    approvedRequests: leaveRequests.filter(r => r.status === "APPROVED").length,
    rejectedRequests: leaveRequests.filter(r => r.status === "REJECTED").length,
    totalDays: leaveRequests.reduce((sum, r) => {
      const startDate = new Date(r.startDate);
      const endDate = new Date(r.endDate);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return sum + days;
    }, 0)
  };

  const handleEditRequest = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setFormData({
      staffId: request.staffId,
      leaveType: request.leaveType,
      startDate: new Date(request.startDate).toISOString().split('T')[0],
      endDate: new Date(request.endDate).toISOString().split('T')[0],
      reason: request.reason || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteRequest = (request: LeaveRequest) => {
    setConfirmDialog({
      open: true,
      type: 'delete',
      leaveRequest: request,
    });
  };

  const handleApproveRequest = (request: LeaveRequest) => {
    setConfirmDialog({
      open: true,
      type: 'approve',
      leaveRequest: request,
    });
  };

  const handleRejectRequest = (request: LeaveRequest) => {
    setConfirmDialog({
      open: true,
      type: 'reject',
      leaveRequest: request,
    });
  };

  const executeDeleteRequest = async (request: LeaveRequest) => {
    setActionLoading(request.id);
    try {
      const response = await deleteLeaveRequest(request.id);
      if (response.success) {
        await fetchLeaveRequests();
        toast.success(t('leave.toasts.deleteSuccess'), {
          description: t('leave.toasts.deleteSuccessDescription', { name: request.staff.name }),
        });
      } else {
        toast.error(t('leave.toasts.deleteError'), {
          description: response.message || t('leave.toasts.unexpectedError'),
        });
      }
    } catch (err) {
      toast.error(t('leave.toasts.deleteError'), {
        description: t('leave.toasts.unexpectedError'),
      });
    } finally {
      setActionLoading(null);
    }
  };

  const executeApproveRequest = async (request: LeaveRequest) => {
    setActionLoading(request.id);
    try {
      // Get current user ID - in a real app, this would come from auth context
      const currentUserId = "current-user-id"; // This should be replaced with actual user ID
      const response = await approveLeaveRequest(request.id, currentUserId);
      if (response.success) {
        await fetchLeaveRequests();
        toast.success(t('leave.toasts.approveSuccess'), {
          description: t('leave.toasts.approveSuccessDescription', { name: request.staff.name }),
        });
      } else {
        toast.error(t('leave.toasts.approveError'), {
          description: response.message || t('leave.toasts.unexpectedError'),
        });
      }
    } catch (err) {
      toast.error(t('leave.toasts.approveError'), {
        description: t('leave.toasts.unexpectedError'),
      });
    } finally {
      setActionLoading(null);
    }
  };

  const executeRejectRequest = async (request: LeaveRequest) => {
    setActionLoading(request.id);
    try {
      // Get current user ID - in a real app, this would come from auth context
      const currentUserId = "current-user-id"; // This should be replaced with actual user ID
      const response = await rejectLeaveRequest(request.id, currentUserId);
      if (response.success) {
        await fetchLeaveRequests();
        toast.success(t('leave.toasts.rejectSuccess'), {
          description: t('leave.toasts.rejectSuccessDescription', { name: request.staff.name }),
        });
      } else {
        toast.error(t('leave.toasts.rejectError'), {
          description: response.message || t('leave.toasts.unexpectedError'),
        });
      }
    } catch (err) {
      toast.error(t('leave.toasts.rejectError'), {
        description: t('leave.toasts.unexpectedError'),
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateRequest = async () => {
    // Validate required fields
    if (!formData.staffId) {
      toast.error(t('leave.toasts.selectStaffMember'));
      return;
    }
    
    if (!formData.startDate || !formData.endDate) {
      toast.error(t('leave.toasts.selectDates'));
      return;
    }
    
    if (!formData.reason || formData.reason.trim() === "") {
      toast.error(t('leave.toasts.provideReason'));
      return;
    }
    
    // Validate dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (startDate >= endDate) {
      toast.error(t('leave.toasts.endDateAfterStart'));
      return;
    }
    
    if (startDate < new Date()) {
      toast.error(t('leave.toasts.noPastDates'));
      return;
    }

    try {
      const createData: CreateLeaveRequestData = {
        staffId: formData.staffId,
        leaveType: formData.leaveType as any,
        startDate: startDate,
        endDate: endDate,
        reason: formData.reason || undefined
      };

      const response = await createLeaveRequest(createData);
      
      if (response.success) {
        await fetchLeaveRequests();
        setIsCreateDialogOpen(false);
        setFormData({
          staffId: "",
          leaveType: "ANNUAL",
          startDate: EthiopianDateFormatter.getCurrentEthiopianDate().toISOString().split('T')[0],
          endDate: EthiopianDateFormatter.getCurrentEthiopianDate().toISOString().split('T')[0],
          reason: ""
        });
        toast.success(t('leave.toasts.createSuccess'), {
          description: t('leave.toasts.createSuccessDescription'),
        });
      } else {
        toast.error(t('leave.toasts.createError'), {
          description: response.message || t('leave.toasts.unexpectedError'),
        });
      }
    } catch (err) {
      console.error("Error creating leave request:", err);
      toast.error(t('leave.toasts.createError'), {
        description: t('leave.toasts.unexpectedError'),
      });
    }
  };

  const handleUpdateRequest = async () => {
    if (!selectedRequest) return;

    try {
      const updateData: Partial<CreateLeaveRequestData> = {
        leaveType: formData.leaveType as any,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        reason: formData.reason || undefined
      };

      const response = await updateLeaveRequest(selectedRequest.id, updateData);
      if (response.success) {
        await fetchLeaveRequests();
        setIsEditDialogOpen(false);
        setSelectedRequest(null);
        toast.success(t('leave.toasts.updateSuccess'), {
          description: t('leave.toasts.updateSuccessDescription', { name: selectedRequest.staff.name }),
        });
      } else {
        toast.error(t('leave.toasts.updateError'), {
          description: response.message || t('leave.toasts.unexpectedError'),
        });
      }
    } catch (err) {
      toast.error(t('leave.toasts.updateError'), {
        description: t('leave.toasts.unexpectedError'),
      });
    }
  };

  // Leave balance handlers
  const handleEditBalance = (balance: LeaveBalance) => {
    setSelectedBalance(balance);
    setBalanceFormData({
      staffId: balance.staffId,
      year: balance.year,
      totalLeaveDays: balance.totalLeaveDays,
      usedLeaveDays: balance.usedLeaveDays
    });
    setIsEditBalanceDialogOpen(true);
  };

  const handleDeleteBalance = (balance: LeaveBalance) => {
    setConfirmDialog({
      open: true,
      type: 'deleteBalance',
      leaveBalance: balance,
    });
  };

  const executeDeleteBalance = async (balance: LeaveBalance) => {
    setActionLoading(balance.id);
    try {
      const response = await deleteLeaveBalance(balance.id);
      if (response.success) {
        await fetchLeaveBalances();
        toast.success(t('leave.toasts.balanceDeleteSuccess'), {
          description: t('leave.toasts.balanceDeleteSuccessDescription', { name: balance.staff.name }),
        });
      } else {
        toast.error(t('leave.toasts.balanceDeleteError'), {
          description: response.message || t('leave.toasts.unexpectedError'),
        });
      }
    } catch (err) {
      toast.error(t('leave.toasts.balanceDeleteError'), {
        description: t('leave.toasts.unexpectedError'),
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateBalance = async () => {
    try {
      const response = await createLeaveBalance({
        staffId: balanceFormData.staffId,
        year: balanceFormData.year,
        totalLeaveDays: balanceFormData.totalLeaveDays,
        usedLeaveDays: balanceFormData.usedLeaveDays
      });
      if (response.success) {
        await fetchLeaveBalances();
        setIsCreateBalanceDialogOpen(false);
        setBalanceFormData({
          staffId: "",
          year: EthiopianCalendarUtils.gregorianToEthiopian(new Date()).year,
          totalLeaveDays: 25,
          usedLeaveDays: 0
        });
        toast.success(t('leave.toasts.balanceCreateSuccess'), {
          description: t('leave.toasts.balanceCreateSuccessDescription'),
        });
      } else {
        toast.error(t('leave.toasts.balanceCreateError'), {
          description: response.message || t('leave.toasts.unexpectedError'),
        });
      }
    } catch (err) {
      toast.error(t('leave.toasts.balanceCreateError'), {
        description: t('leave.toasts.unexpectedError'),
      });
    }
  };

  const handleUpdateBalance = async () => {
    if (!selectedBalance) return;

    try {
      const response = await updateLeaveBalance(selectedBalance.staffId, {
        staffId: selectedBalance.staffId,
        year: balanceFormData.year,
        totalLeaveDays: balanceFormData.totalLeaveDays,
        usedLeaveDays: balanceFormData.usedLeaveDays
      });
      if (response.success) {
        await fetchLeaveBalances();
        setIsEditBalanceDialogOpen(false);
        setSelectedBalance(null);
        toast.success(t('leave.toasts.balanceUpdateSuccess'), {
          description: t('leave.toasts.balanceUpdateSuccessDescription', { name: selectedBalance.staff.name }),
        });
      } else {
        toast.error(t('leave.toasts.balanceUpdateError'), {
          description: response.message || t('leave.toasts.unexpectedError'),
        });
      }
    } catch (err) {
      toast.error(t('leave.toasts.balanceUpdateError'), {
        description: t('leave.toasts.unexpectedError'),
      });
    }
  };

  const handleStatusChange = async (leaveRequest: LeaveRequest, newStatus: string) => {
    try {
      setActionLoading(leaveRequest.id);

      if (newStatus === 'APPROVED') {
        // TODO: Get actual approver ID from auth context
        const approverId = "admin-user-id"; // This should come from auth context
        const response = await approveLeaveRequest(leaveRequest.id, approverId);
        if (response.success) {
          await fetchLeaveRequests();
          toast.success(t('leave.toasts.approveSuccess'), {
            description: t('leave.toasts.approveSuccessDescription', { name: leaveRequest.staff.name }),
          });
        } else {
          toast.error(t('leave.toasts.approveError'), {
            description: response.message || t('leave.toasts.unexpectedError'),
          });
        }
      } else if (newStatus === 'REJECTED') {
        // TODO: Get actual approver ID from auth context
        const approverId = "admin-user-id"; // This should come from auth context
        const response = await rejectLeaveRequest(leaveRequest.id, approverId);
        if (response.success) {
          await fetchLeaveRequests();
          toast.success(t('leave.toasts.rejectSuccess'), {
            description: t('leave.toasts.rejectSuccessDescription', { name: leaveRequest.staff.name }),
          });
        } else {
          toast.error(t('leave.toasts.rejectError'), {
            description: response.message || t('leave.toasts.unexpectedError'),
          });
        }
      } else if (newStatus === 'CANCELLED') {
        const response = await cancelLeaveRequest(leaveRequest.id);
        if (response.success) {
          await fetchLeaveRequests();
          toast.success(t('leave.toasts.cancelSuccess'), {
            description: t('leave.toasts.cancelSuccessDescription'),
          });
        } else {
          toast.error(t('leave.toasts.cancelError'), {
            description: response.message || t('leave.toasts.unexpectedError'),
          });
        }
      }
    } catch (error) {
      console.error("Error changing status:", error);
      toast.error(t('leave.toasts.changeStatusError'), {
        description: t('leave.toasts.unexpectedError'),
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.type) return;

    if (confirmDialog.type === 'delete' && confirmDialog.leaveRequest) {
      await executeDeleteRequest(confirmDialog.leaveRequest);
    } else if (confirmDialog.type === 'approve' && confirmDialog.leaveRequest) {
      await executeApproveRequest(confirmDialog.leaveRequest);
    } else if (confirmDialog.type === 'reject' && confirmDialog.leaveRequest) {
      await executeRejectRequest(confirmDialog.leaveRequest);
    } else if (confirmDialog.type === 'deleteBalance' && confirmDialog.leaveBalance) {
      await executeDeleteBalance(confirmDialog.leaveBalance);
    }

    setConfirmDialog({
      open: false,
      type: null,
      leaveRequest: null,
      leaveBalance: null,
    });
  };

  // Create table columns with handlers
  const leaveColumns = createLeaveTableColumns({
    onEdit: handleEditRequest,
    onDelete: handleDeleteRequest,
    onApprove: handleApproveRequest,
    onReject: handleRejectRequest,
    onStatusChange: handleStatusChange,
    currentUserRole: "ADMIN", // This should come from auth context
    t,
  });

  const leaveBalanceColumns = createLeaveBalanceTableColumns({
    onEdit: handleEditBalance,
    onDelete: handleDeleteBalance,
    t,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('leave.pageTitle')}</h2>
        <p className="text-muted-foreground">
          {t('leave.pageDescription')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('leave.stats.totalRequests')}</CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-muted"
                >
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  selected={new Date()}
                  onSelect={(date) => {
                    if (date) {
                      // Handle date selection - you can filter requests by this date
                      console.log('Selected date:', date);
                    }
                  }}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                />
              </PopoverContent>
            </Popover>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{leaveStats.totalRequests}</div>
                <p className="text-xs text-muted-foreground">
                  {t('leave.stats.thisMonth')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('leave.stats.pending')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold text-yellow-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-yellow-600">{leaveStats.pendingRequests}</div>
                <p className="text-xs text-muted-foreground">
                  {t('leave.stats.awaitingApproval')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('leave.stats.approved')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold text-green-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">{leaveStats.approvedRequests}</div>
                <p className="text-xs text-muted-foreground">
                  {t('leave.stats.successfullyApproved')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('leave.stats.totalDays')}</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{leaveStats.totalDays}</div>
                <p className="text-xs text-muted-foreground">
                  {t('leave.stats.leaveDaysTaken')}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="requests">{t('leave.tabs.leaveRequests')}</TabsTrigger>
          <TabsTrigger value="balance">{t('leave.tabs.leaveBalance')}</TabsTrigger>
        </TabsList>

        {/* Leave Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          {/* Filters */}

          {/* Leave Requests Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle>{t('leave.requestsTab.title')}</CardTitle>
                  <CardDescription>
                    {t('leave.requestsTab.description')} ({leaveRequests.length} {t('leave.requestsTab.requestsCount')})
                  </CardDescription>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('leave.requestsTab.requestLeave')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">{t('leave.requestsTab.loading')}</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 mb-2">{t('leave.requestsTab.errorLoading')}</p>
                    <p className="text-muted-foreground text-sm">{error}</p>
                    <Button 
                      variant="outline" 
                      onClick={fetchLeaveRequests}
                      className="mt-4"
                    >
                      {t('leave.requestsTab.tryAgain')}
                    </Button>
                  </div>
                </div>
              ) : (
                <LeaveTable
                  columns={leaveColumns}
                  data={leaveRequests}
                  staffList={staffList}
                  onStatusChange={handleStatusChange}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>


        {/* Leave Balance Tab */}
        <TabsContent value="balance" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle>{t('leave.balanceTab.title')}</CardTitle>
                  <CardDescription>
                    {t('leave.balanceTab.description')} ({leaveBalances.length} {t('leave.balanceTab.balancesCount')})
                  </CardDescription>
                </div>
                <Button onClick={() => setIsCreateBalanceDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('leave.balanceTab.addLeaveBalance')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {balanceLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">{t('leave.balanceTab.loading')}</p>
                  </div>
                </div>
              ) : (
                <LeaveBalanceTable
                  columns={leaveBalanceColumns}
                  data={leaveBalances}
                  staffList={staffList}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Leave Request Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('leave.dialogs.create.title')}</DialogTitle>
            <DialogDescription>
              {t('leave.dialogs.create.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t('leave.dialogs.create.leaveType')} <span className="text-red-500">{t('leave.dialogs.create.required')}</span></label>
                <Select 
                  value={formData.leaveType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, leaveType: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('leave.dialogs.create.selectLeaveType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANNUAL">{t('leave.leaveTypes.annual')}</SelectItem>
                    <SelectItem value="SICK">{t('leave.leaveTypes.sick')}</SelectItem>
                    <SelectItem value="CASUAL">{t('leave.leaveTypes.casual')}</SelectItem>
                    <SelectItem value="MATERNITY">{t('leave.leaveTypes.maternity')}</SelectItem>
                    <SelectItem value="PATERNITY">{t('leave.leaveTypes.paternity')}</SelectItem>
                    <SelectItem value="UNPAID">{t('leave.leaveTypes.unpaid')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">{t('leave.dialogs.create.staffMember')} <span className="text-red-500">{t('leave.dialogs.create.required')}</span></label>
                <Select 
                  value={formData.staffId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, staffId: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('leave.dialogs.create.selectStaffMember')} />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t('leave.dialogs.create.startDate')} <span className="text-red-500">{t('leave.dialogs.create.required')}</span></label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      {formData.startDate ? (
                        EthiopianDateFormatter.formatForTable(new Date(formData.startDate))
                      ) : (
                        <span>{t('leave.dialogs.create.selectStartDate')}</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      selected={formData.startDate ? new Date(formData.startDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setFormData(prev => ({ ...prev, startDate: date.toISOString().split('T')[0] }));
                        }
                      }}
                      disabled={(date) =>
                        date < new Date("1900-01-01")
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium">{t('leave.dialogs.create.endDate')} <span className="text-red-500">{t('leave.dialogs.create.required')}</span></label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !formData.endDate && "text-muted-foreground"
                      )}
                    >
                      {formData.endDate ? (
                        EthiopianDateFormatter.formatForTable(new Date(formData.endDate))
                      ) : (
                        <span>{t('leave.dialogs.create.selectEndDate')}</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      selected={formData.endDate ? new Date(formData.endDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setFormData(prev => ({ ...prev, endDate: date.toISOString().split('T')[0] }));
                        }
                      }}
                      disabled={(date) =>
                        date < new Date("1900-01-01") || 
                        (formData.startDate ? date < new Date(formData.startDate) : false)
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">{t('leave.dialogs.create.reason')} <span className="text-red-500">{t('leave.dialogs.create.required')}</span></label>
              <Textarea 
                className="w-full"
                placeholder={t('leave.dialogs.create.reasonPlaceholder')}
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {t('leave.dialogs.create.cancel')}
            </Button>
            <Button type="button" onClick={handleCreateRequest}>
              {t('leave.dialogs.create.submitRequest')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Leave Request Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('leave.dialogs.edit.title')}</DialogTitle>
            <DialogDescription>
              {t('leave.dialogs.edit.description')}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('leave.dialogs.edit.staffMember')}</label>
                  <Input className="w-full" value={selectedRequest?.staff.name || ''} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('leave.dialogs.edit.leaveType')} <span className="text-red-500">{t('leave.dialogs.edit.required')}</span></label>
                  <Select 
                    value={formData.leaveType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, leaveType: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ANNUAL">{t('leave.leaveTypes.annual')}</SelectItem>
                      <SelectItem value="SICK">{t('leave.leaveTypes.sick')}</SelectItem>
                      <SelectItem value="CASUAL">{t('leave.leaveTypes.casual')}</SelectItem>
                      <SelectItem value="MATERNITY">{t('leave.leaveTypes.maternity')}</SelectItem>
                      <SelectItem value="PATERNITY">{t('leave.leaveTypes.paternity')}</SelectItem>
                      <SelectItem value="UNPAID">{t('leave.leaveTypes.unpaid')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('leave.dialogs.edit.startDate')} <span className="text-red-500">{t('leave.dialogs.edit.required')}</span></label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !formData.startDate && "text-muted-foreground"
                        )}
                      >
                        {formData.startDate ? (
                          EthiopianDateFormatter.formatForTable(new Date(formData.startDate))
                        ) : (
                          <span>{t('leave.dialogs.edit.selectStartDate')}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        selected={formData.startDate ? new Date(formData.startDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setFormData(prev => ({ ...prev, startDate: date.toISOString().split('T')[0] }));
                          }
                        }}
                        disabled={(date) =>
                          date < new Date("1900-01-01")
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-sm font-medium">{t('leave.dialogs.edit.endDate')} <span className="text-red-500">{t('leave.dialogs.edit.required')}</span></label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !formData.endDate && "text-muted-foreground"
                        )}
                      >
                        {formData.endDate ? (
                          EthiopianDateFormatter.formatForTable(new Date(formData.endDate))
                        ) : (
                          <span>{t('leave.dialogs.edit.selectEndDate')}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        selected={formData.endDate ? new Date(formData.endDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setFormData(prev => ({ ...prev, endDate: date.toISOString().split('T')[0] }));
                          }
                        }}
                        disabled={(date) =>
                          date < new Date("1900-01-01") || 
                          (formData.startDate ? date < new Date(formData.startDate) : false)
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">{t('leave.dialogs.edit.reason')} <span className="text-red-500">{t('leave.dialogs.edit.required')}</span></label>
                <Textarea 
                  className="w-full"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('leave.dialogs.edit.status')}</label>
                <Input className="w-full" value={selectedRequest?.status || ''} disabled />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('leave.dialogs.edit.cancel')}
            </Button>
            <Button type="button" onClick={handleUpdateRequest}>
              {t('leave.dialogs.edit.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Leave Balance Dialog */}
      <Dialog open={isCreateBalanceDialogOpen} onOpenChange={setIsCreateBalanceDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('leave.dialogs.createBalance.title')}</DialogTitle>
            <DialogDescription>
              {t('leave.dialogs.createBalance.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t('leave.dialogs.createBalance.staffMember')} <span className="text-red-500">{t('leave.dialogs.createBalance.required')}</span></label>
                <Select 
                  value={balanceFormData.staffId}
                  onValueChange={(value) => setBalanceFormData(prev => ({ ...prev, staffId: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('leave.dialogs.createBalance.selectStaffMember')} />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">{t('leave.dialogs.createBalance.year')} <span className="text-red-500">{t('leave.dialogs.createBalance.required')}</span></label>
                <Input 
                  className="w-full"
                  type="number"
                  value={balanceFormData.year}
                  onChange={(e) => setBalanceFormData(prev => ({ ...prev, year: parseInt(e.target.value) || EthiopianCalendarUtils.gregorianToEthiopian(new Date()).year }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t('leave.dialogs.createBalance.totalLeaveDays')} <span className="text-red-500">{t('leave.dialogs.createBalance.required')}</span></label>
                <Input 
                  className="w-full"
                  type="number"
                  value={balanceFormData.totalLeaveDays}
                  onChange={(e) => setBalanceFormData(prev => ({ ...prev, totalLeaveDays: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('leave.dialogs.createBalance.usedLeaveDays')} <span className="text-red-500">{t('leave.dialogs.createBalance.required')}</span></label>
                <Input 
                  className="w-full"
                  type="number"
                  value={balanceFormData.usedLeaveDays}
                  onChange={(e) => setBalanceFormData(prev => ({ ...prev, usedLeaveDays: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreateBalanceDialogOpen(false)}>
              {t('leave.dialogs.createBalance.cancel')}
            </Button>
            <Button type="button" onClick={handleCreateBalance}>
              {t('leave.dialogs.createBalance.addLeaveBalance')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Leave Balance Dialog */}
      <Dialog open={isEditBalanceDialogOpen} onOpenChange={setIsEditBalanceDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('leave.dialogs.editBalance.title')}</DialogTitle>
            <DialogDescription>
              {t('leave.dialogs.editBalance.description')} {selectedBalance?.staff.name}.
            </DialogDescription>
          </DialogHeader>
          {selectedBalance && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('leave.dialogs.editBalance.staffMember')}</label>
                  <Input className="w-full" value={selectedBalance.staff.name} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('leave.dialogs.editBalance.year')} <span className="text-red-500">{t('leave.dialogs.editBalance.required')}</span></label>
                  <Input 
                    className="w-full"
                    type="number"
                    value={balanceFormData.year}
                    onChange={(e) => setBalanceFormData(prev => ({ ...prev, year: parseInt(e.target.value) || EthiopianCalendarUtils.gregorianToEthiopian(new Date()).year }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('leave.dialogs.editBalance.totalLeaveDays')} <span className="text-red-500">{t('leave.dialogs.editBalance.required')}</span></label>
                  <Input 
                    className="w-full"
                    type="number"
                    value={balanceFormData.totalLeaveDays}
                    onChange={(e) => setBalanceFormData(prev => ({ ...prev, totalLeaveDays: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('leave.dialogs.editBalance.usedLeaveDays')} <span className="text-red-500">{t('leave.dialogs.editBalance.required')}</span></label>
                  <Input 
                    className="w-full"
                    type="number"
                    value={balanceFormData.usedLeaveDays}
                    onChange={(e) => setBalanceFormData(prev => ({ ...prev, usedLeaveDays: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditBalanceDialogOpen(false)}>
              {t('leave.dialogs.editBalance.cancel')}
            </Button>
            <Button type="button" onClick={handleUpdateBalance}>
              {t('leave.dialogs.editBalance.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={
          confirmDialog.type === 'delete' 
            ? t('leave.dialogs.delete.title')
            : confirmDialog.type === 'approve'
            ? t('leave.dialogs.approve.title')
            : confirmDialog.type === 'reject'
            ? t('leave.dialogs.reject.title')
            : confirmDialog.type === 'deleteBalance'
            ? t('leave.dialogs.deleteBalance.title')
            : t('leave.dialogs.confirmAction')
        }
        desc={
          confirmDialog.leaveRequest
            ? confirmDialog.type === 'delete'
              ? `${t('leave.dialogs.delete.description')} ${confirmDialog.leaveRequest.staff.name}${t('leave.dialogs.delete.descriptionEnd')}`
              : confirmDialog.type === 'approve'
              ? `${t('leave.dialogs.approve.description')} ${confirmDialog.leaveRequest.staff.name}${t('leave.dialogs.approve.descriptionEnd')}`
              : confirmDialog.type === 'reject'
              ? `${t('leave.dialogs.reject.description')} ${confirmDialog.leaveRequest.staff.name}${t('leave.dialogs.reject.descriptionEnd')}`
              : t('leave.dialogs.areYouSure')
            : confirmDialog.leaveBalance
            ? `${t('leave.dialogs.deleteBalance.description')} ${confirmDialog.leaveBalance.staff.name}${t('leave.dialogs.deleteBalance.descriptionEnd')}`
            : t('leave.dialogs.areYouSure')
        }
        confirmText={
          confirmDialog.type === 'delete' 
            ? t('leave.dialogs.delete.confirmText')
            : confirmDialog.type === 'approve'
            ? t('leave.dialogs.approve.confirmText')
            : confirmDialog.type === 'reject'
            ? t('leave.dialogs.reject.confirmText')
            : confirmDialog.type === 'deleteBalance'
            ? t('leave.dialogs.deleteBalance.confirmText')
            : t('leave.dialogs.confirmAction')
        }
        cancelBtnText={t('leave.dialogs.delete.cancel')}
        destructive={confirmDialog.type === 'delete' || confirmDialog.type === 'reject' || confirmDialog.type === 'deleteBalance'}
        handleConfirm={handleConfirmAction}
        isLoading={actionLoading === (confirmDialog.leaveRequest?.id || confirmDialog.leaveBalance?.id)}
      />
    </div>
  );
}
