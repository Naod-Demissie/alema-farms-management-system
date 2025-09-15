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
  Download,
  Calculator,
  TrendingUp,
  Users,
  Calendar,
  FileText
} from "lucide-react";
import { getPayroll, createPayroll, updatePayroll, deletePayroll } from "@/server/payroll";
import { getStaff as getStaffList } from "@/server/staff";
import { CreatePayrollData, UpdatePayrollData } from "@/server/types";
import { PayrollTable } from "./payroll-table";
import { createPayrollTableColumns, PayrollRecord } from "./payroll-table-columns";
import { PayrollTableToolbar } from "./payroll-table-toolbar";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";

// Types
interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
}

// Mock data removed - now using real data from database

const statusColors = {
  Paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Draft: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  Failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export function PayrollManagement() {
  const [activeTab, setActiveTab] = useState("records");
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
        toast.success("Payroll record deleted successfully!", {
          description: `The payroll record for ${payroll.staff.name} has been removed`,
        });
      } else {
        toast.error("Failed to delete payroll record", {
          description: response.message || "An unexpected error occurred",
        });
      }
    } catch (err) {
      toast.error("Failed to delete payroll record", {
        description: "An unexpected error occurred",
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
        toast.success("Payroll record created successfully!", {
          description: "The new payroll record has been added",
        });
      } else {
        toast.error("Failed to create payroll record", {
          description: response.message || "An unexpected error occurred",
        });
      }
    } catch (err) {
      toast.error("Failed to create payroll record", {
        description: "An unexpected error occurred",
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
        toast.success("Payroll record updated successfully!", {
          description: `The payroll record for ${selectedPayroll.staff.name} has been updated`,
        });
      } else {
        toast.error("Failed to update payroll record", {
          description: response.message || "An unexpected error occurred",
        });
      }
    } catch (err) {
      toast.error("Failed to update payroll record", {
        description: "An unexpected error occurred",
      });
    }
  };

  // Create table columns with handlers
  const payrollColumns = createPayrollTableColumns({
    onEdit: handleEditPayroll,
    onDelete: handleDeletePayroll,
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
            <p className="mt-2 text-muted-foreground">Loading payroll data...</p>
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
            <Button onClick={() => fetchPayrollData()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payroll Management</h2>
          <p className="text-muted-foreground">
            Manage staff salaries, bonuses, and payroll processing.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Payroll
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            <span className="text-sm font-medium text-muted-foreground">ETB</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalPayroll.toLocaleString()} ETB</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalStats.paidAmount.toLocaleString()} ETB</div>
            <p className="text-xs text-muted-foreground">
              Successfully processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totalStats.pendingAmount.toLocaleString()} ETB</div>
            <p className="text-xs text-muted-foreground">
              Awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.averageSalary.toLocaleString()} ETB</div>
            <p className="text-xs text-muted-foreground">
              Per staff member
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="records">Payroll Records</TabsTrigger>
          <TabsTrigger value="calculator">Salary Calculator</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Payroll Records Tab */}
        <TabsContent value="records" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Records</CardTitle>
              <CardDescription>
                All payroll records for staff members with advanced filtering.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PayrollTable 
                columns={payrollColumns} 
                data={payrollData}
                staffList={staffList}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salary Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="mr-2 h-5 w-5" />
                Salary Calculator
              </CardTitle>
              <CardDescription>
                Calculate salary, bonuses, and deductions for staff members.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Staff Member</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
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
                <div>
                  <label className="text-sm font-medium">Pay Period</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jan-2024">January 2024</SelectItem>
                      <SelectItem value="feb-2024">February 2024</SelectItem>
                      <SelectItem value="mar-2024">March 2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium">Base Salary</label>
                  <Input type="number" placeholder="5000" />
                </div>
                <div>
                  <label className="text-sm font-medium">Bonus</label>
                  <Input type="number" placeholder="500" />
                </div>
                <div>
                  <label className="text-sm font-medium">Deductions</label>
                  <Input type="number" placeholder="200" />
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Net Salary:</span>
                  <span className="text-2xl font-bold">5,300.00 ETB</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button>
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculate
                </Button>
                <Button variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Payslip
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Summary</CardTitle>
                <CardDescription>
                  Monthly payroll breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Base Salary</span>
                    <span className="font-medium">15,000 ETB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Bonuses</span>
                    <span className="font-medium">1,000 ETB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Deductions</span>
                    <span className="font-medium">570 ETB</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Net Payroll</span>
                    <span className="font-bold">15,430 ETB</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Earners</CardTitle>
                <CardDescription>
                  Staff with highest salaries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>John Doe</span>
                    <Badge className="bg-green-100 text-green-800">5,300 ETB</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Jane Smith</span>
                    <Badge className="bg-green-100 text-green-800">4,150 ETB</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Sarah Wilson</span>
                    <Badge className="bg-green-100 text-green-800">3,080 ETB</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Export Reports</CardTitle>
              <CardDescription>
                Generate and download payroll reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Monthly Report
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Payslips
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Tax Report
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Custom Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Payroll Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Payroll Record</DialogTitle>
            <DialogDescription>
              Add a new payroll record for a staff member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Staff Member</label>
                  <Select value={formData.staffId} onValueChange={(value) => setFormData({...formData, staffId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
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
              <div>
                <label className="text-sm font-medium">Pay Period</label>
                  <Input 
                    type="text" 
                    placeholder="e.g., January 2024"
                    value={formData.period}
                    onChange={(e) => setFormData({...formData, period: e.target.value})}
                  />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Base Salary</label>
                  <Input 
                    type="number" 
                    placeholder="5000" 
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: Number(e.target.value)})}
                  />
              </div>
              <div>
                <label className="text-sm font-medium">Bonus</label>
                  <Input 
                    type="number" 
                    placeholder="500" 
                    value={formData.bonus}
                    onChange={(e) => setFormData({...formData, bonus: Number(e.target.value)})}
                  />
              </div>
              <div>
                <label className="text-sm font-medium">Deductions</label>
                  <Input 
                    type="number" 
                    placeholder="200" 
                    value={formData.deductions}
                    onChange={(e) => setFormData({...formData, deductions: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Paid Date</label>
                <Input 
                  type="date" 
                  value={formData.paidOn}
                  onChange={(e) => setFormData({...formData, paidOn: e.target.value})}
                />
            </div>
            <div>
              <label className="text-sm font-medium">Payment Method</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePayroll}>
              Create Payroll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payroll Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Payroll Record</DialogTitle>
            <DialogDescription>
              Update payroll record information.
            </DialogDescription>
          </DialogHeader>
          {selectedPayroll && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Staff Member</label>
                  <Input value={selectedPayroll.staff.name} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium">Pay Period</label>
                  <Input 
                    value={formData.period}
                    onChange={(e) => setFormData({...formData, period: e.target.value})}
                    placeholder="e.g., January 2024"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Base Salary</label>
                  <Input 
                    type="number" 
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Bonus</label>
                  <Input 
                    type="number" 
                    value={formData.bonus}
                    onChange={(e) => setFormData({...formData, bonus: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Deductions</label>
                  <Input 
                    type="number" 
                    value={formData.deductions}
                    onChange={(e) => setFormData({...formData, deductions: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Paid Date</label>
                <Input 
                  type="date" 
                  value={formData.paidOn}
                  onChange={(e) => setFormData({...formData, paidOn: e.target.value})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePayroll}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title="Delete Payroll Record"
        desc={
          confirmDialog.payroll
            ? `Are you sure you want to delete the payroll record for ${confirmDialog.payroll.staff.name}? This action cannot be undone and the payroll record will be permanently removed.`
            : 'Are you sure you want to proceed?'
        }
        confirmText="Delete Payroll Record"
        cancelBtnText="Cancel"
        destructive={true}
        handleConfirm={handleConfirmAction}
        isLoading={actionLoading === confirmDialog.payroll?.id}
      />
    </div>
  );
}
