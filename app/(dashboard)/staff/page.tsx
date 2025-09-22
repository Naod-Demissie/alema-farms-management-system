"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserPlus,
  Clock,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  UserCheck,
  TrendingUp,
} from "lucide-react";

// Import components (we'll create these)
import { StaffDirectory } from "./components/staff-directory";
import { AttendanceManagement } from "./components/attendance-management";
import { PayrollManagement } from "./components/payroll-management";
import { LeaveManagement } from "./components/leave-management";
import { StaffInvitations } from "./components/staff-invitations";
import StaffProvider from "@/features/staff/context/staff-context";

export default function StaffManagementPage() {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data for overview cards
  const overviewStats = {
    totalStaff: 24,
    activeStaff: 22,
    newHires: 3,
    attendanceRate: 94.5,
    pendingLeaves: 5,
    upcomingPayroll: 2,
  };

  const recentActivity = [
    {
      id: 1,
      action: "John Doe checked in",
      time: "2 minutes ago",
      type: "attendance",
    },
    {
      id: 2,
      action: "Jane Smith submitted leave request",
      time: "15 minutes ago",
      type: "leave",
    },
    {
      id: 3,
      action: "Mike Johnson completed onboarding",
      time: "1 hour ago",
      type: "onboarding",
    },
    {
      id: 4,
      action: "Sarah Wilson's payroll processed",
      time: "2 hours ago",
      type: "payroll",
    },
  ];

  return (
    <StaffProvider>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Staff Management
            </h1>
            <p className="text-muted-foreground">
              Manage your staff members, attendance, payroll, and more.
            </p>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="directory">Staffs</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="leave">Leave</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Staff
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {overviewStats.totalStaff}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +{overviewStats.newHires} new this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Staff
                  </CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {overviewStats.activeStaff}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {overviewStats.totalStaff - overviewStats.activeStaff}{" "}
                    inactive
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Attendance Rate
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {overviewStats.attendanceRate}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +2.1% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Leaves
                  </CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {overviewStats.pendingLeaves}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Requires approval
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions and Recent Activity */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common staff management tasks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Clock className="mr-2 h-4 w-4" />
                    Check In/Out
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    Request Leave
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Process Payroll
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest staff activities and updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center space-x-3"
                      >
                        <div className="flex-shrink-0">
                          {activity.type === "attendance" && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {activity.type === "leave" && (
                            <Calendar className="h-4 w-4 text-blue-500" />
                          )}
                          {activity.type === "onboarding" && (
                            <UserPlus className="h-4 w-4 text-purple-500" />
                          )}
                          {activity.type === "payroll" && (
                            <DollarSign className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.action}
                          </p>
                          <p className="text-sm text-gray-500">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Staff Directory Tab */}
          <TabsContent value="directory">
            <StaffDirectory />
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <AttendanceManagement />
          </TabsContent>

          {/* Payroll Tab */}
          <TabsContent value="payroll">
            <PayrollManagement />
          </TabsContent>

          {/* Leave Management Tab */}
          <TabsContent value="leave">
            <LeaveManagement />
          </TabsContent>
        </Tabs>
      </div>
    </StaffProvider>
  );
}
