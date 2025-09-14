"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  Clock,
  DollarSign,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Target,
  Award,
  Activity
} from "lucide-react";

// Mock data
const attendanceData = [
  { month: "Jan", present: 95, absent: 5, late: 2 },
  { month: "Feb", present: 92, absent: 8, late: 3 },
  { month: "Mar", present: 98, absent: 2, late: 1 },
  { month: "Apr", present: 94, absent: 6, late: 4 },
  { month: "May", present: 96, absent: 4, late: 2 },
  { month: "Jun", present: 97, absent: 3, late: 1 },
];

const productivityData = [
  { staff: "John Doe", tasks: 45, completed: 42, efficiency: 93 },
  { staff: "Jane Smith", tasks: 38, completed: 36, efficiency: 95 },
  { staff: "Mike Johnson", tasks: 52, completed: 48, efficiency: 92 },
  { staff: "Sarah Wilson", tasks: 41, completed: 38, efficiency: 93 },
];

const leaveData = [
  { type: "Annual", used: 45, remaining: 155, percentage: 22.5 },
  { type: "Sick", used: 12, remaining: 108, percentage: 10 },
  { type: "Casual", used: 8, remaining: 32, percentage: 20 },
  { type: "Maternity", used: 90, remaining: 10, percentage: 90 },
];

const payrollData = [
  { month: "Jan", total: 15430, average: 3857 },
  { month: "Feb", total: 16200, average: 4050 },
  { month: "Mar", total: 15890, average: 3972 },
  { month: "Apr", total: 16150, average: 4037 },
  { month: "May", total: 15980, average: 3995 },
  { month: "Jun", total: 16320, average: 4080 },
];

export function StaffAnalytics() {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("6months");
  const [department, setDepartment] = useState("all");

  const overallStats = {
    totalStaff: 24,
    activeStaff: 22,
    averageAttendance: 95.3,
    totalPayroll: 16320,
    averageSalary: 4080,
    leaveUtilization: 22.5,
    productivity: 93.2
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Staff Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for staff management.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Customize your analytics view with different filters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="text-sm font-medium">Time Range</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Department</label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="admin">Administration</SelectItem>
                  <SelectItem value="veterinary">Veterinary</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallStats.totalStaff}</div>
                <p className="text-xs text-muted-foreground">
                  +2 from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallStats.averageAttendance}%</div>
                <p className="text-xs text-muted-foreground">
                  +2.1% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Productivity</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallStats.productivity}%</div>
                <p className="text-xs text-muted-foreground">
                  +1.2% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Salary</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${overallStats.averageSalary.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +5.2% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Trend</CardTitle>
                <CardDescription>
                  Monthly attendance rates over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground mt-2">Chart component would be integrated here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Productivity by Staff</CardTitle>
                <CardDescription>
                  Individual staff productivity metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {productivityData.map((staff, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{staff.staff}</p>
                        <p className="text-xs text-muted-foreground">
                          {staff.completed}/{staff.tasks} tasks completed
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{staff.efficiency}%</p>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${staff.efficiency}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Trends</CardTitle>
                <CardDescription>
                  Monthly attendance patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground mt-2">Attendance chart would be here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance Summary</CardTitle>
                <CardDescription>
                  Current month statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Present</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: "95%" }}></div>
                      </div>
                      <span className="text-sm font-medium">95%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Absent</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-red-600 h-2 rounded-full" style={{ width: "3%" }}></div>
                      </div>
                      <span className="text-sm font-medium">3%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Late</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{ width: "2%" }}></div>
                      </div>
                      <span className="text-sm font-medium">2%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Productivity Tab */}
        <TabsContent value="productivity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Productivity Metrics</CardTitle>
              <CardDescription>
                Staff productivity and performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {productivityData.map((staff, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{staff.staff}</h3>
                      <span className="text-sm font-medium text-green-600">{staff.efficiency}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                      <span>Tasks: {staff.tasks}</span>
                      <span>Completed: {staff.completed}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${staff.efficiency}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Tab */}
        <TabsContent value="payroll" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Trends</CardTitle>
                <CardDescription>
                  Monthly payroll costs and averages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground mt-2">Payroll chart would be here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payroll Summary</CardTitle>
                <CardDescription>
                  Current month payroll breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Payroll</span>
                    <span className="font-medium">$16,320</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Average Salary</span>
                    <span className="font-medium">$4,080</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Highest Salary</span>
                    <span className="font-medium">$5,300</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Lowest Salary</span>
                    <span className="font-medium">$2,900</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Leave Tab */}
        <TabsContent value="leave" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Leave Utilization</CardTitle>
                <CardDescription>
                  Leave usage by type and percentage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaveData.map((leave, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{leave.type}</span>
                        <span className="text-sm text-muted-foreground">
                          {leave.used}/{leave.used + leave.remaining} days
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${leave.percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Used: {leave.used}</span>
                        <span>Remaining: {leave.remaining}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leave Trends</CardTitle>
                <CardDescription>
                  Monthly leave request patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground mt-2">Leave trends chart would be here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
