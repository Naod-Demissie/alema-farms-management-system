"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { 
  DollarSign, 
  Plus, 
  Search, 
  Filter, 
  Download,
  Edit,
  Trash2,
  Calculator,
  TrendingUp,
  Users,
  Calendar,
  FileText
} from "lucide-react";

// Mock data
const payrollData = [
  {
    id: "1",
    staffName: "John Doe",
    period: "January 2024",
    baseSalary: 5000,
    bonus: 500,
    deductions: 200,
    netSalary: 5300,
    status: "Paid",
    paidDate: "2024-01-31",
    method: "Bank Transfer"
  },
  {
    id: "2",
    staffName: "Jane Smith",
    period: "January 2024",
    baseSalary: 4000,
    bonus: 300,
    deductions: 150,
    netSalary: 4150,
    status: "Paid",
    paidDate: "2024-01-31",
    method: "Bank Transfer"
  },
  {
    id: "3",
    staffName: "Mike Johnson",
    period: "January 2024",
    baseSalary: 3000,
    bonus: 0,
    deductions: 100,
    netSalary: 2900,
    status: "Pending",
    paidDate: null,
    method: "Bank Transfer"
  },
  {
    id: "4",
    staffName: "Sarah Wilson",
    period: "January 2024",
    baseSalary: 3000,
    bonus: 200,
    deductions: 120,
    netSalary: 3080,
    status: "Draft",
    paidDate: null,
    method: "Bank Transfer"
  },
];

const statusColors = {
  Paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Draft: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  Failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export function PayrollManagement() {
  const [activeTab, setActiveTab] = useState("records");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);

  const filteredPayroll = payrollData.filter((record) => {
    const matchesSearch = record.staffName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalStats = {
    totalPayroll: payrollData.reduce((sum, record) => sum + record.netSalary, 0),
    paidAmount: payrollData.filter(r => r.status === "Paid").reduce((sum, record) => sum + record.netSalary, 0),
    pendingAmount: payrollData.filter(r => r.status === "Pending").reduce((sum, record) => sum + record.netSalary, 0),
    averageSalary: Math.round(payrollData.reduce((sum, record) => sum + record.netSalary, 0) / payrollData.length)
  };

  const handleEditPayroll = (payroll: any) => {
    setSelectedPayroll(payroll);
    setIsEditDialogOpen(true);
  };

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
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalStats.totalPayroll.toLocaleString()}</div>
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
            <div className="text-2xl font-bold text-green-600">${totalStats.paidAmount.toLocaleString()}</div>
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
            <div className="text-2xl font-bold text-yellow-600">${totalStats.pendingAmount.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">${totalStats.averageSalary.toLocaleString()}</div>
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
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Filter payroll records by staff, status, or period.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by staff name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Table */}
          <Card>
            <CardHeader>
              <CardTitle>Payroll Records</CardTitle>
              <CardDescription>
                All payroll records for staff members.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayroll.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.staffName}</TableCell>
                      <TableCell>{record.period}</TableCell>
                      <TableCell>${record.baseSalary.toLocaleString()}</TableCell>
                      <TableCell>${record.bonus.toLocaleString()}</TableCell>
                      <TableCell>${record.deductions.toLocaleString()}</TableCell>
                      <TableCell className="font-medium">${record.netSalary.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[record.status as keyof typeof statusColors]}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.paidDate ? new Date(record.paidDate).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPayroll(record)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                      <SelectItem value="john">John Doe</SelectItem>
                      <SelectItem value="jane">Jane Smith</SelectItem>
                      <SelectItem value="mike">Mike Johnson</SelectItem>
                      <SelectItem value="sarah">Sarah Wilson</SelectItem>
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
                  <span className="text-2xl font-bold">$5,300.00</span>
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
                    <span className="font-medium">$15,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Bonuses</span>
                    <span className="font-medium">$1,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Deductions</span>
                    <span className="font-medium">$570</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Net Payroll</span>
                    <span className="font-bold">$15,430</span>
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
                    <Badge className="bg-green-100 text-green-800">$5,300</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Jane Smith</span>
                    <Badge className="bg-green-100 text-green-800">$4,150</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Sarah Wilson</span>
                    <Badge className="bg-green-100 text-green-800">$3,080</Badge>
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
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="john">John Doe</SelectItem>
                    <SelectItem value="jane">Jane Smith</SelectItem>
                    <SelectItem value="mike">Mike Johnson</SelectItem>
                    <SelectItem value="sarah">Sarah Wilson</SelectItem>
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
            <div className="grid grid-cols-3 gap-4">
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
            <Button onClick={() => setIsCreateDialogOpen(false)}>
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
                  <Input defaultValue={selectedPayroll.staffName} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium">Pay Period</label>
                  <Input defaultValue={selectedPayroll.period} disabled />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Base Salary</label>
                  <Input type="number" defaultValue={selectedPayroll.baseSalary} />
                </div>
                <div>
                  <label className="text-sm font-medium">Bonus</label>
                  <Input type="number" defaultValue={selectedPayroll.bonus} />
                </div>
                <div>
                  <label className="text-sm font-medium">Deductions</label>
                  <Input type="number" defaultValue={selectedPayroll.deductions} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select defaultValue={selectedPayroll.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsEditDialogOpen(false)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
