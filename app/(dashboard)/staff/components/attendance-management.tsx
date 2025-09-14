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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  MapPin,
  Search,
  Filter,
  Download,
  QrCode,
  TrendingUp,
  Users,
  UserCheck
} from "lucide-react";

// Mock data
const attendanceData = [
  {
    id: "1",
    staffName: "John Doe",
    date: "2024-01-20",
    checkIn: "08:00",
    checkOut: "17:00",
    status: "Present",
    location: "Main Office",
    hours: 9
  },
  {
    id: "2",
    staffName: "Jane Smith",
    date: "2024-01-20",
    checkIn: "08:15",
    checkOut: "16:45",
    status: "Present",
    location: "Main Office",
    hours: 8.5
  },
  {
    id: "3",
    staffName: "Mike Johnson",
    date: "2024-01-20",
    checkIn: "09:00",
    checkOut: null,
    status: "Present",
    location: "Field Office",
    hours: 0
  },
  {
    id: "4",
    staffName: "Sarah Wilson",
    date: "2024-01-20",
    checkIn: null,
    checkOut: null,
    status: "Absent",
    location: null,
    hours: 0
  },
];

const statusColors = {
  Present: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Absent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  Late: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  "On Leave": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
};

export function AttendanceManagement() {
  const [activeTab, setActiveTab] = useState("checkin");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");

  const filteredAttendance = attendanceData.filter((record) => {
    const matchesSearch = record.staffName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const todayStats = {
    totalStaff: 24,
    present: 20,
    absent: 2,
    late: 2,
    averageHours: 8.2
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attendance Management</h2>
          <p className="text-muted-foreground">
            Track staff attendance and manage check-in/check-out.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <QrCode className="mr-2 h-4 w-4" />
            QR Scanner
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.totalStaff}</div>
            <p className="text-xs text-muted-foreground">
              Registered staff members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{todayStats.present}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((todayStats.present / todayStats.totalStaff) * 100)}% attendance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{todayStats.absent}</div>
            <p className="text-xs text-muted-foreground">
              Staff not present
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.averageHours}h</div>
            <p className="text-xs text-muted-foreground">
              Per staff member today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="checkin">Check In/Out</TabsTrigger>
          <TabsTrigger value="records">Attendance Records</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Check In/Out Tab */}
        <TabsContent value="checkin" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Check In Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                  Check In
                </CardTitle>
                <CardDescription>
                  Record your arrival time and location.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main-office">Main Office</SelectItem>
                      <SelectItem value="field-office">Field Office</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" size="lg">
                  <Clock className="mr-2 h-4 w-4" />
                  Check In Now
                </Button>
                <div className="text-sm text-muted-foreground text-center">
                  Current time: {new Date().toLocaleTimeString()}
                </div>
              </CardContent>
            </Card>

            {/* Check Out Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <XCircle className="mr-2 h-5 w-5 text-red-600" />
                  Check Out
                </CardTitle>
                <CardDescription>
                  Record your departure time.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Checked in at:</div>
                  <div className="font-medium">08:00 AM - Main Office</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Hours worked: 8h 30m
                  </div>
                </div>
                <Button className="w-full" size="lg" variant="outline">
                  <Clock className="mr-2 h-4 w-4" />
                  Check Out Now
                </Button>
                <div className="text-sm text-muted-foreground text-center">
                  Current time: {new Date().toLocaleTimeString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Summary</CardTitle>
              <CardDescription>
                Overview of today's attendance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{todayStats.present}</div>
                  <div className="text-sm text-muted-foreground">Present</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{todayStats.absent}</div>
                  <div className="text-sm text-muted-foreground">Absent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{todayStats.late}</div>
                  <div className="text-sm text-muted-foreground">Late</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Records Tab */}
        <TabsContent value="records" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Filter attendance records by staff, status, or date.
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
                    <SelectItem value="Present">Present</SelectItem>
                    <SelectItem value="Absent">Absent</SelectItem>
                    <SelectItem value="Late">Late</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                Detailed attendance records for all staff members.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.staffName}</TableCell>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {record.checkIn ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            {record.checkIn}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.checkOut ? (
                          <div className="flex items-center text-red-600">
                            <XCircle className="mr-1 h-3 w-3" />
                            {record.checkOut}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[record.status as keyof typeof statusColors]}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.location ? (
                          <div className="flex items-center text-sm">
                            <MapPin className="mr-1 h-3 w-3" />
                            {record.location}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.hours > 0 ? `${record.hours}h` : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
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
                <CardTitle>Attendance Summary</CardTitle>
                <CardDescription>
                  Weekly attendance overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Monday</span>
                    <Badge variant="outline">95%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Tuesday</span>
                    <Badge variant="outline">92%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Wednesday</span>
                    <Badge variant="outline">98%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Thursday</span>
                    <Badge variant="outline">94%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Friday</span>
                    <Badge variant="outline">96%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>
                  Staff with best attendance records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>John Doe</span>
                    <Badge className="bg-green-100 text-green-800">100%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Jane Smith</span>
                    <Badge className="bg-green-100 text-green-800">98%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Mike Johnson</span>
                    <Badge className="bg-green-100 text-green-800">96%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Export Reports</CardTitle>
              <CardDescription>
                Generate and download attendance reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Daily Report
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Weekly Report
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Monthly Report
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
    </div>
  );
}
