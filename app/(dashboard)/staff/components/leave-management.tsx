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
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  Edit,
  Trash2,
  User,
  CalendarDays
} from "lucide-react";

// Mock data
const leaveRequests = [
  {
    id: "1",
    staffName: "John Doe",
    leaveType: "Annual",
    startDate: "2024-02-01",
    endDate: "2024-02-05",
    days: 5,
    reason: "Family vacation",
    status: "Approved",
    submittedDate: "2024-01-15",
    approvedBy: "Jane Smith",
    approvedDate: "2024-01-16"
  },
  {
    id: "2",
    staffName: "Jane Smith",
    leaveType: "Sick",
    startDate: "2024-01-20",
    endDate: "2024-01-22",
    days: 3,
    reason: "Flu symptoms",
    status: "Pending",
    submittedDate: "2024-01-19",
    approvedBy: null,
    approvedDate: null
  },
  {
    id: "3",
    staffName: "Mike Johnson",
    leaveType: "Maternity",
    startDate: "2024-03-01",
    endDate: "2024-06-01",
    days: 90,
    reason: "Paternity leave",
    status: "Approved",
    submittedDate: "2024-01-10",
    approvedBy: "John Doe",
    approvedDate: "2024-01-11"
  },
  {
    id: "4",
    staffName: "Sarah Wilson",
    leaveType: "Casual",
    startDate: "2024-01-25",
    endDate: "2024-01-25",
    days: 1,
    reason: "Personal appointment",
    status: "Rejected",
    submittedDate: "2024-01-24",
    approvedBy: "John Doe",
    approvedDate: "2024-01-24"
  },
];

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  Cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

const leaveTypeColors = {
  Annual: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  Sick: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  Maternity: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  Paternity: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  Casual: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Unpaid: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

export function LeaveManagement() {
  const [activeTab, setActiveTab] = useState("requests");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const filteredRequests = leaveRequests.filter((request) => {
    const matchesSearch = request.staffName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesType = typeFilter === "all" || request.leaveType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const leaveStats = {
    totalRequests: leaveRequests.length,
    pendingRequests: leaveRequests.filter(r => r.status === "Pending").length,
    approvedRequests: leaveRequests.filter(r => r.status === "Approved").length,
    rejectedRequests: leaveRequests.filter(r => r.status === "Rejected").length,
    totalDays: leaveRequests.reduce((sum, r) => sum + r.days, 0)
  };

  const handleEditRequest = (request: any) => {
    setSelectedRequest(request);
    setIsEditDialogOpen(true);
  };

  const handleApproveRequest = (requestId: string) => {
    // Handle approval logic
    console.log("Approving request:", requestId);
  };

  const handleRejectRequest = (requestId: string) => {
    // Handle rejection logic
    console.log("Rejecting request:", requestId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Leave Management</h2>
          <p className="text-muted-foreground">
            Manage staff leave requests and approvals.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Request Leave
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveStats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{leaveStats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{leaveStats.approvedRequests}</div>
            <p className="text-xs text-muted-foreground">
              Successfully approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Days</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveStats.totalDays}</div>
            <p className="text-xs text-muted-foreground">
              Leave days taken
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          <TabsTrigger value="calendar">Leave Calendar</TabsTrigger>
          <TabsTrigger value="balance">Leave Balance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Leave Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Filter leave requests by staff, status, or type.
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
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Annual">Annual</SelectItem>
                    <SelectItem value="Sick">Sick</SelectItem>
                    <SelectItem value="Maternity">Maternity</SelectItem>
                    <SelectItem value="Paternity">Paternity</SelectItem>
                    <SelectItem value="Casual">Casual</SelectItem>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Leave Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle>Leave Requests</CardTitle>
              <CardDescription>
                All leave requests from staff members.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.staffName}</TableCell>
                      <TableCell>
                        <Badge className={leaveTypeColors[request.leaveType as keyof typeof leaveTypeColors]}>
                          {request.leaveType}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(request.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(request.endDate).toLocaleDateString()}</TableCell>
                      <TableCell>{request.days}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{request.reason}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[request.status as keyof typeof statusColors]}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(request.submittedDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {request.status === "Pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApproveRequest(request.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRejectRequest(request.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRequest(request)}
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

        {/* Leave Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leave Calendar</CardTitle>
              <CardDescription>
                Visual calendar showing approved leave periods.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Calendar View</h3>
                <p className="text-muted-foreground">
                  Calendar component would be integrated here to show leave periods.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Balance Tab */}
        <TabsContent value="balance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leave Balance</CardTitle>
              <CardDescription>
                Current leave balance for all staff members.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Annual Leave</TableHead>
                    <TableHead>Sick Leave</TableHead>
                    <TableHead>Casual Leave</TableHead>
                    <TableHead>Used Days</TableHead>
                    <TableHead>Remaining</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">John Doe</TableCell>
                    <TableCell>25</TableCell>
                    <TableCell>12</TableCell>
                    <TableCell>5</TableCell>
                    <TableCell>8</TableCell>
                    <TableCell className="text-green-600 font-medium">34</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Jane Smith</TableCell>
                    <TableCell>25</TableCell>
                    <TableCell>12</TableCell>
                    <TableCell>5</TableCell>
                    <TableCell>15</TableCell>
                    <TableCell className="text-green-600 font-medium">27</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Mike Johnson</TableCell>
                    <TableCell>25</TableCell>
                    <TableCell>12</TableCell>
                    <TableCell>5</TableCell>
                    <TableCell>3</TableCell>
                    <TableCell className="text-green-600 font-medium">39</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Leave Summary</CardTitle>
                <CardDescription>
                  Monthly leave statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Requests</span>
                    <span className="font-medium">{leaveStats.totalRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Approved</span>
                    <span className="font-medium text-green-600">{leaveStats.approvedRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending</span>
                    <span className="font-medium text-yellow-600">{leaveStats.pendingRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rejected</span>
                    <span className="font-medium text-red-600">{leaveStats.rejectedRequests}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leave Types</CardTitle>
                <CardDescription>
                  Breakdown by leave type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Annual Leave</span>
                    <Badge variant="outline">12</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Sick Leave</span>
                    <Badge variant="outline">5</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Casual Leave</span>
                    <Badge variant="outline">3</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Maternity/Paternity</span>
                    <Badge variant="outline">1</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Export Reports</CardTitle>
              <CardDescription>
                Generate and download leave reports
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
                  Leave Balance
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

      {/* Create Leave Request Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Leave</DialogTitle>
            <DialogDescription>
              Submit a new leave request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Leave Type</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Annual">Annual Leave</SelectItem>
                    <SelectItem value="Sick">Sick Leave</SelectItem>
                    <SelectItem value="Casual">Casual Leave</SelectItem>
                    <SelectItem value="Maternity">Maternity Leave</SelectItem>
                    <SelectItem value="Paternity">Paternity Leave</SelectItem>
                    <SelectItem value="Unpaid">Unpaid Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Input type="date" />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <Input type="date" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Textarea placeholder="Enter reason for leave..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(false)}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Leave Request Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Leave Request</DialogTitle>
            <DialogDescription>
              Update leave request information.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Staff Member</label>
                  <Input defaultValue={selectedRequest.staffName} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium">Leave Type</label>
                  <Select defaultValue={selectedRequest.leaveType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Annual">Annual Leave</SelectItem>
                      <SelectItem value="Sick">Sick Leave</SelectItem>
                      <SelectItem value="Casual">Casual Leave</SelectItem>
                      <SelectItem value="Maternity">Maternity Leave</SelectItem>
                      <SelectItem value="Paternity">Paternity Leave</SelectItem>
                      <SelectItem value="Unpaid">Unpaid Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input type="date" defaultValue={selectedRequest.startDate} />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <Input type="date" defaultValue={selectedRequest.endDate} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Reason</label>
                <Textarea defaultValue={selectedRequest.reason} />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select defaultValue={selectedRequest.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
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
