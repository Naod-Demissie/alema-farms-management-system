"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Calendar,
  Users,
  Clock,
  DollarSign,
  Target,
  CheckCircle,
  AlertCircle,
  Download,
  FileText
} from "lucide-react";

interface ReportFilters {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  flockId: string;
  reportType: string;
}

interface StaffReportsProps {
  filters: ReportFilters;
}

interface StaffData {
  totalStaff: number;
  activeStaff: number;
  averageAttendance: number;
  totalPayroll: number;
  averageSalary: number;
  leaveUtilization: number;
  productivity: number;
  attendanceTrends: Array<{
    month: string;
    present: number;
    absent: number;
    late: number;
    attendanceRate: number;
  }>;
  payrollTrends: Array<{
    month: string;
    total: number;
    average: number;
  }>;
  leaveBreakdown: Array<{
    type: string;
    used: number;
    remaining: number;
    percentage: number;
  }>;
  productivityByStaff: Array<{
    staffId: string;
    name: string;
    role: string;
    tasks: number;
    completed: number;
    efficiency: number;
    attendance: number;
  }>;
  departmentStats: Array<{
    department: string;
    staffCount: number;
    averageAttendance: number;
    averageSalary: number;
    productivity: number;
  }>;
}

export function StaffReports({ filters }: StaffReportsProps) {
  const [data, setData] = useState<StaffData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchStaffData();
  }, [filters]);

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockData: StaffData = {
        totalStaff: 24,
        activeStaff: 22,
        averageAttendance: 95.3,
        totalPayroll: 16320,
        averageSalary: 4080,
        leaveUtilization: 22.5,
        productivity: 93.2,
        attendanceTrends: [
          { month: "Jan", present: 95, absent: 5, late: 2, attendanceRate: 95.0 },
          { month: "Feb", present: 92, absent: 8, late: 3, attendanceRate: 92.0 },
          { month: "Mar", present: 98, absent: 2, late: 1, attendanceRate: 98.0 },
          { month: "Apr", present: 94, absent: 6, late: 4, attendanceRate: 94.0 },
          { month: "May", present: 96, absent: 4, late: 2, attendanceRate: 96.0 },
          { month: "Jun", present: 97, absent: 3, late: 1, attendanceRate: 97.0 }
        ],
        payrollTrends: [
          { month: "Jan", total: 15430, average: 3857 },
          { month: "Feb", total: 16200, average: 4050 },
          { month: "Mar", total: 15890, average: 3972 },
          { month: "Apr", total: 16150, average: 4037 },
          { month: "May", total: 15980, average: 3995 },
          { month: "Jun", total: 16320, average: 4080 }
        ],
        leaveBreakdown: [
          { type: "Annual", used: 45, remaining: 155, percentage: 22.5 },
          { type: "Sick", used: 12, remaining: 108, percentage: 10.0 },
          { type: "Casual", used: 8, remaining: 32, percentage: 20.0 },
          { type: "Maternity", used: 90, remaining: 10, percentage: 90.0 }
        ],
        productivityByStaff: [
          { staffId: "1", name: "John Doe", role: "Manager", tasks: 45, completed: 42, efficiency: 93, attendance: 98 },
          { staffId: "2", name: "Jane Smith", role: "Veterinarian", tasks: 38, completed: 36, efficiency: 95, attendance: 96 },
          { staffId: "3", name: "Mike Johnson", role: "Worker", tasks: 52, completed: 48, efficiency: 92, attendance: 94 },
          { staffId: "4", name: "Sarah Wilson", role: "Worker", tasks: 41, completed: 38, efficiency: 93, attendance: 97 }
        ],
        departmentStats: [
          { department: "Administration", staffCount: 4, averageAttendance: 96.5, averageSalary: 5500, productivity: 95 },
          { department: "Veterinary", staffCount: 3, averageAttendance: 94.2, averageSalary: 4800, productivity: 92 },
          { department: "Operations", staffCount: 17, averageAttendance: 95.1, averageSalary: 3800, productivity: 91 }
        ]
      };
      
      setData(mockData);
    } catch (error) {
      console.error("Error fetching staff data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    console.log(`Exporting staff report as ${format}`);
    // Implement export logic
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Manager': return 'bg-blue-500';
      case 'Veterinarian': return 'bg-green-500';
      case 'Worker': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 95) return 'text-green-600 bg-green-100';
    if (efficiency >= 85) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getAttendanceColor = (attendance: number) => {
    if (attendance >= 95) return 'text-green-600 bg-green-100';
    if (attendance >= 85) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No staff data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalStaff}</div>
            <p className="text-xs text-muted-foreground">
              {data.activeStaff} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averageAttendance}%</div>
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
            <div className="text-2xl font-bold">{data.productivity}%</div>
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
            <div className="text-2xl font-bold">${data.averageSalary.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +5.2% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="productivity">Productivity</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="leave">Leave Management</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Department Distribution
                </CardTitle>
                <CardDescription>Staff distribution across departments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.departmentStats.map((dept) => {
                    const percentage = (dept.staffCount / data.totalStaff) * 100;
                    return (
                      <div key={dept.department} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="font-medium">{dept.department}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{dept.staffCount}</div>
                            <div className="text-sm text-muted-foreground">
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Leave Utilization
                </CardTitle>
                <CardDescription>Leave usage by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.leaveBreakdown.map((leave) => (
                    <div key={leave.type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{leave.type}</span>
                        <div className="text-right">
                          <div className="font-bold">{leave.used}/{leave.used + leave.remaining}</div>
                          <div className="text-sm text-muted-foreground">
                            {leave.percentage}%
                          </div>
                        </div>
                      </div>
                      <Progress value={leave.percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Used: {leave.used}</span>
                        <span>Remaining: {leave.remaining}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Trends</CardTitle>
              <CardDescription>Monthly attendance patterns and rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.attendanceTrends.map((month) => (
                  <div key={month.month} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{month.month}</h3>
                      <Badge variant={month.attendanceRate >= 95 ? "default" : "secondary"}>
                        {month.attendanceRate}% attendance
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Present</div>
                        <div className="font-medium text-green-600">{month.present}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Absent</div>
                        <div className="font-medium text-red-600">{month.absent}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Late</div>
                        <div className="font-medium text-yellow-600">{month.late}</div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Attendance Rate</span>
                        <span>{month.attendanceRate}%</span>
                      </div>
                      <Progress value={month.attendanceRate} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Productivity Tab */}
        <TabsContent value="productivity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Productivity</CardTitle>
              <CardDescription>Individual staff productivity metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.productivityByStaff.map((staff) => (
                  <div key={staff.staffId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{staff.name}</h3>
                        <p className="text-sm text-muted-foreground">{staff.role}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getEfficiencyColor(staff.efficiency)}>
                          {staff.efficiency}% efficiency
                        </Badge>
                        <Badge className={getAttendanceColor(staff.attendance)}>
                          {staff.attendance}% attendance
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Tasks</div>
                        <div className="font-medium">{staff.tasks}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Completed</div>
                        <div className="font-medium">{staff.completed}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Efficiency</div>
                        <div className="font-medium">{staff.efficiency}%</div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Efficiency</span>
                        <span>{staff.efficiency}%</span>
                      </div>
                      <Progress value={staff.efficiency} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Tab */}
        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Trends</CardTitle>
              <CardDescription>Monthly payroll costs and averages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.payrollTrends.map((month) => (
                  <div key={month.month} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{month.month}</h3>
                      <Badge variant="outline">
                        ${month.total.toLocaleString()} total
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Total Payroll</div>
                        <div className="font-medium">${month.total.toLocaleString()}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Average Salary</div>
                        <div className="font-medium">${month.average.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Management Tab */}
        <TabsContent value="leave" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leave Management</CardTitle>
              <CardDescription>Leave utilization and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data.leaveBreakdown.map((leave) => (
                  <div key={leave.type} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{leave.type}</h3>
                      <Badge variant="outline">
                        {leave.used}/{leave.used + leave.remaining} days
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                      <span>Utilization rate</span>
                      <span>{leave.percentage}%</span>
                    </div>
                    <Progress value={leave.percentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>Used: {leave.used}</span>
                      <span>Remaining: {leave.remaining}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
              <CardDescription>Performance metrics by department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.departmentStats.map((dept) => (
                  <div key={dept.department} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{dept.department}</h3>
                      <Badge variant="outline">
                        {dept.staffCount} staff
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Attendance</div>
                        <div className="font-medium">{dept.averageAttendance}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Avg Salary</div>
                        <div className="font-medium">${dept.averageSalary.toLocaleString()}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Productivity</div>
                        <div className="font-medium">{dept.productivity}%</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Attendance Rate</span>
                        <span>{dept.averageAttendance}%</span>
                      </div>
                      <Progress value={dept.averageAttendance} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
