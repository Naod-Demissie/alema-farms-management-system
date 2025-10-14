"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  TrendingUp,
  Users,
  Calendar,
  CalendarIcon
} from "lucide-react";
import { MonthPicker } from "@/components/ui/monthpicker";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";
import { cn } from "@/lib/utils";
import { getPayroll, createPayroll, updatePayroll, deletePayroll } from "@/app/(dashboard)/staff/server/payroll";
import { getStaff as getStaffList } from "@/app/(dashboard)/staff/server/staff";
import { CreatePayrollData, UpdatePayrollData } from "../../types/types";
import { PayrollTable } from "./payroll-table";
import { createPayrollTableColumns, PayrollRecord } from "./payroll-table-columns";
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

// Mock data removed - now using real data from database


export function PayrollManagement() {
  const t = useTranslations('staff');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  
  // Real data state
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | null;
    payroll?: PayrollRecord | null;
  }>({
    open: false,
    type: null,
    payroll: null,
  });
  
  // Form state for create/edit
  const [formData, setFormData] = useState({
    staffId: "",
    salary: 0,
    bonus: 0,
    deductions: 0,
    paidOn: new Date().toISOString().split('T')[0],
    period: ""
  });
  
  // Additional state for date pickers
  const [selectedPayPeriod, setSelectedPayPeriod] = useState<Date | undefined>(EthiopianDateFormatter.getCurrentEthiopianDate());
  const [selectedPaidDate, setSelectedPaidDate] = useState<Date | undefined>(EthiopianDateFormatter.getCurrentEthiopianDate());

  // Helper functions
  const handlePayPeriodSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedPayPeriod(date);
      setFormData({...formData, period: EthiopianDateFormatter.formatForTable(date)});
    }
  };

  const handlePaidDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedPaidDate(date);
      setFormData({...formData, paidOn: date.toISOString().split('T')[0]});
    }
  };

  const calculateNetSalary = () => {
    return formData.salary + formData.bonus - formData.deductions;
  };

  // Data fetching functions
  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      const response = await getPayroll();
      if (response.success && response.data) {
        setPayrollData(response.data);
      } else {
        setError(response.message || "Failed to fetch payroll data");
      }
    } catch (err) {
      setError("Failed to fetch payroll data");
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffList = async () => {
    try {
      const response = await getStaffList();
      if (response.success && response.data) {
        setStaffList(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch staff list:", err);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchPayrollData();
    fetchStaffList();
  }, []);

  const handleEditPayroll = (payroll: PayrollRecord) => {
    setSelectedPayroll(payroll);
    setFormData({
      staffId: payroll.staffId,
      salary: payroll.salary,
      bonus: payroll.bonus || 0,
      deductions: payroll.deductions || 0,
      paidOn: new Date(payroll.paidOn).toISOString().split('T')[0],
      period: ""
    });
    setSelectedPaidDate(new Date(payroll.paidOn));
    setSelectedPayPeriod(new Date(payroll.paidOn));
    setIsEditDialogOpen(true);
  };

  const handleDeletePayroll = (payroll: PayrollRecord) => {
    setConfirmDialog({
      open: true,
      type: 'delete',
      payroll,
    });
  };

  const executeDeletePayroll = async (payroll: PayrollRecord) => {
    setActionLoading(payroll.id);
    try {
      const response = await deletePayroll(payroll.id);
      if (response.success) {
        await fetchPayrollData();
        toast.success(t('payroll.toasts.deleteSuccess'), {
          description: t('payroll.toasts.deleteSuccessDescription', { name: payroll.staff.name }),
        });
      } else {
        toast.error(t('payroll.toasts.deleteError'), {
          description: response.message || t('payroll.toasts.unexpectedError'),
        });
      }
    } catch (err) {
      toast.error(t('payroll.toasts.deleteError'), {
        description: t('payroll.toasts.unexpectedError'),
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.type) return;

    if (confirmDialog.type === 'delete' && confirmDialog.payroll) {
      await executeDeletePayroll(confirmDialog.payroll);
    }

    setConfirmDialog({
      open: false,
      type: null,
      payroll: null,
    });
  };

  const handleCreatePayroll = async () => {
    try {
      const createData: CreatePayrollData = {
        staffId: formData.staffId,
        salary: formData.salary,
        bonus: formData.bonus,
        deductions: formData.deductions,
        paidOn: new Date(formData.paidOn),
        period: formData.period
      };

      const response = await createPayroll(createData);
      if (response.success) {
        await fetchPayrollData();
        setIsCreateDialogOpen(false);
        setFormData({
          staffId: "",
          salary: 0,
          bonus: 0,
          deductions: 0,
          paidOn: new Date().toISOString().split('T')[0],
          period: ""
        });
        toast.success(t('payroll.toasts.createSuccess'), {
          description: t('payroll.toasts.createSuccessDescription'),
        });
      } else {
        toast.error(t('payroll.toasts.createError'), {
          description: response.message || t('payroll.toasts.unexpectedError'),
        });
      }
    } catch (err) {
      toast.error(t('payroll.toasts.createError'), {
        description: t('payroll.toasts.unexpectedError'),
      });
    }
  };

  const handleUpdatePayroll = async () => {
    if (!selectedPayroll) return;

    try {
      const updateData: UpdatePayrollData = {
        salary: formData.salary,
        bonus: formData.bonus,
        deductions: formData.deductions,
        paidOn: new Date(formData.paidOn)
      };

      const response = await updatePayroll(selectedPayroll.id, updateData);
      if (response.success) {
        await fetchPayrollData();
        setIsEditDialogOpen(false);
        setSelectedPayroll(null);
        toast.success(t('payroll.toasts.updateSuccess'), {
          description: t('payroll.toasts.updateSuccessDescription', { name: selectedPayroll.staff.name }),
        });
      } else {
        toast.error(t('payroll.toasts.updateError'), {
          description: response.message || t('payroll.toasts.unexpectedError'),
        });
      }
    } catch (err) {
      toast.error(t('payroll.toasts.updateError'), {
        description: t('payroll.toasts.unexpectedError'),
      });
    }
  };

  // Create table columns with handlers
  const payrollColumns = createPayrollTableColumns({
    onEdit: handleEditPayroll,
    onDelete: handleDeletePayroll,
    t,
  });

  const totalStats = {
    totalPayroll: payrollData.reduce((sum, record) => sum + record.netSalary, 0),
    paidAmount: payrollData.reduce((sum, record) => sum + record.netSalary, 0), // All records are considered paid since they have a paidOn date
    pendingAmount: 0, // No pending status in current schema
    averageSalary: payrollData.length > 0 ? Math.round(payrollData.reduce((sum, record) => sum + record.netSalary, 0) / payrollData.length) : 0
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">{t('payroll.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => fetchPayrollData()}>{t('payroll.retry')}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('payroll.pageTitle')}</h2>
        <p className="text-muted-foreground">
          {t('payroll.pageDescription')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('payroll.stats.totalPayroll')}</CardTitle>
            <span className="text-sm font-medium text-muted-foreground">ETB</span>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{totalStats.totalPayroll.toLocaleString()} ETB</div>
                <p className="text-xs text-muted-foreground">
                  {t('payroll.stats.thisMonth')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('payroll.stats.paidAmount')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold text-green-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">{totalStats.paidAmount.toLocaleString()} ETB</div>
                <p className="text-xs text-muted-foreground">
                  {t('payroll.stats.successfullyProcessed')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('payroll.stats.pendingAmount')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold text-yellow-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-yellow-600">{totalStats.pendingAmount.toLocaleString()} ETB</div>
                <p className="text-xs text-muted-foreground">
                  {t('payroll.stats.awaitingProcessing')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('payroll.stats.averageSalary')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{totalStats.averageSalary.toLocaleString()} ETB</div>
                <p className="text-xs text-muted-foreground">
                  {t('payroll.stats.perStaffMember')}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payroll Records */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>{t('payroll.table.title')}</CardTitle>
              <CardDescription>
                {t('payroll.table.description')}
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('payroll.buttons.createPayroll')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <PayrollTable 
            columns={payrollColumns} 
            data={payrollData}
          />
        </CardContent>
      </Card>

      {/* Create Payroll Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-[calc(32rem-80px)]">
          <DialogHeader>
            <DialogTitle>{t('payroll.dialogs.create.title')}</DialogTitle>
            <DialogDescription>
              {t('payroll.dialogs.create.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  {t('payroll.dialogs.create.staffMember')} <span className="text-red-500">{t('payroll.dialogs.create.required')}</span>
                </label>
                <Select value={formData.staffId} onValueChange={(value) => setFormData({...formData, staffId: value})}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('payroll.dialogs.create.staffMemberPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                      {staffList.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name} ({staff.role})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  {t('payroll.dialogs.create.payPeriod')} <span className="text-red-500">{t('payroll.dialogs.create.required')}</span>
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !selectedPayPeriod && "text-muted-foreground"
                      )}
                    >
                      {selectedPayPeriod ? (
                        EthiopianDateFormatter.formatForTable(selectedPayPeriod)
                      ) : (
                        <span>{t('payroll.dialogs.create.payPeriodPlaceholder')}</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <MonthPicker
                      selectedMonth={selectedPayPeriod}
                      onMonthSelect={handlePayPeriodSelect}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {/* Second row: Paid Date and Payment Method */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  {t('payroll.dialogs.create.paidDate')} <span className="text-red-500">{t('payroll.dialogs.create.required')}</span>
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !selectedPaidDate && "text-muted-foreground"
                      )}
                    >
                      {selectedPaidDate ? (
                        EthiopianDateFormatter.formatForTable(selectedPaidDate)
                      ) : (
                        <span>{t('payroll.dialogs.create.paidDatePlaceholder')}</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedPaidDate}
                      onSelect={handlePaidDateSelect}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  {t('payroll.dialogs.create.paymentMethod')} <span className="text-red-500">{t('payroll.dialogs.create.required')}</span>
                </label>
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('payroll.dialogs.create.paymentMethodPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank-transfer">{t('payroll.dialogs.create.bankTransfer')}</SelectItem>
                    <SelectItem value="check">{t('payroll.dialogs.create.check')}</SelectItem>
                    <SelectItem value="cash">{t('payroll.dialogs.create.cash')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  {t('payroll.dialogs.create.baseSalary')} <span className="text-red-500">{t('payroll.dialogs.create.required')}</span>
                </label>
                <Input 
                  type="number" 
                  placeholder={t('payroll.dialogs.create.baseSalaryPlaceholder')}
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: Number(e.target.value)})}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('payroll.dialogs.create.bonus')}</label>
                <Input 
                  type="number" 
                  placeholder={t('payroll.dialogs.create.bonusPlaceholder')}
                  value={formData.bonus}
                  onChange={(e) => setFormData({...formData, bonus: Number(e.target.value)})}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('payroll.dialogs.create.deductions')}</label>
                <Input 
                  type="number" 
                  placeholder={t('payroll.dialogs.create.deductionsPlaceholder')}
                  value={formData.deductions}
                  onChange={(e) => setFormData({...formData, deductions: Number(e.target.value)})}
                  className="w-full"
                />
              </div>
            </div>
              
              {/* Net Salary Display */}
              <div className="space-y-2">
                <div className="bg-muted/50 p-3 rounded-lg text-center">
                  <div className="text-sm text-muted-foreground mb-1">{t('payroll.dialogs.create.netSalary')}</div>
                  <div className="text-xl font-semibold">
                    {new Intl.NumberFormat("en-ET", {
                      style: "currency",
                      currency: "ETB",
                    }).format(calculateNetSalary())}
                  </div>
                </div>
              </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {t('payroll.buttons.cancel')}
            </Button>
            <Button onClick={handleCreatePayroll}>
              {t('payroll.buttons.createPayroll')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payroll Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[calc(32rem-80px)]">
          <DialogHeader>
            <DialogTitle>{t('payroll.dialogs.edit.title')}</DialogTitle>
            <DialogDescription>
              {t('payroll.dialogs.edit.description')}
            </DialogDescription>
          </DialogHeader>
          {selectedPayroll && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('payroll.dialogs.edit.staffMember')}</label>
                  <Input value={selectedPayroll.staff.name} disabled className="w-full" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    {t('payroll.dialogs.create.payPeriod')} <span className="text-red-500">{t('payroll.dialogs.create.required')}</span>
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !selectedPayPeriod && "text-muted-foreground"
                        )}
                      >
                        {selectedPayPeriod ? (
                          EthiopianDateFormatter.formatForTable(selectedPayPeriod)
                        ) : (
                          <span>{t('payroll.dialogs.create.payPeriodPlaceholder')}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <MonthPicker
                        selectedMonth={selectedPayPeriod}
                        onMonthSelect={handlePayPeriodSelect}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              {/* Second row: Paid Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    {t('payroll.dialogs.create.paidDate')} <span className="text-red-500">{t('payroll.dialogs.create.required')}</span>
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !selectedPaidDate && "text-muted-foreground"
                        )}
                      >
                          {selectedPaidDate ? (
                            EthiopianDateFormatter.formatForTable(selectedPaidDate)
                          ) : (
                          <span>{t('payroll.dialogs.create.paidDatePlaceholder')}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={selectedPaidDate}
                        onSelect={handlePaidDateSelect}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  {/* Empty div for spacing */}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    {t('payroll.dialogs.create.baseSalary')} <span className="text-red-500">{t('payroll.dialogs.create.required')}</span>
                  </label>
                  <Input 
                    type="number" 
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: Number(e.target.value)})}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('payroll.dialogs.create.bonus')}</label>
                  <Input 
                    type="number" 
                    value={formData.bonus}
                    onChange={(e) => setFormData({...formData, bonus: Number(e.target.value)})}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('payroll.dialogs.create.deductions')}</label>
                  <Input 
                    type="number" 
                    value={formData.deductions}
                    onChange={(e) => setFormData({...formData, deductions: Number(e.target.value)})}
                    className="w-full"
                  />
                </div>
              </div>
              
              {/* Net Salary Display */}
              <div className="space-y-2">
                <div className="bg-muted/50 p-3 rounded-lg text-center">
                  <div className="text-sm text-muted-foreground mb-1">{t('payroll.dialogs.create.netSalary')}</div>
                  <div className="text-xl font-semibold">
                    {new Intl.NumberFormat("en-ET", {
                      style: "currency",
                      currency: "ETB",
                    }).format(calculateNetSalary())}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('payroll.buttons.cancel')}
            </Button>
            <Button onClick={handleUpdatePayroll}>
              {t('payroll.buttons.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={t('payroll.dialogs.delete.title')}
        desc={
          confirmDialog.payroll
            ? t('payroll.dialogs.delete.description', { name: confirmDialog.payroll.staff.name })
            : 'Are you sure you want to proceed?'
        }
        confirmText={t('payroll.dialogs.delete.confirmText')}
        cancelBtnText={t('payroll.buttons.cancel')}
        destructive={true}
        handleConfirm={handleConfirmAction}
        isLoading={actionLoading === confirmDialog.payroll?.id}
      />
    </div>
  );
}
