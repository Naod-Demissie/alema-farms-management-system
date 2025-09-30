"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { StaffDirectory } from "./components/staff-directory";
import { AttendanceManagement } from "./components/attendance-management";
import { PayrollManagement } from "./components/payroll-management";
import { LeaveManagement } from "./components/leave-management";
import { StaffInvitations } from "./components/staff-invitations";
import StaffProvider from "@/features/staff/context/staff-context";

export default function StaffManagementPage() {
  const [activeTab, setActiveTab] = useState("directory");

  return (
    <StaffProvider>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Staff Management
          </h1>
          <p className="text-muted-foreground">
            Manage your staff members, attendance, payroll, and more.
          </p>
        </div>

        {/* Main Content with Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 h-auto">
            <TabsTrigger 
              value="directory"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-300 hover:text-white transition-colors rounded-md"
            >
              Staffs
            </TabsTrigger>
            <TabsTrigger 
              value="payroll"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-300 hover:text-white transition-colors rounded-md"
            >
              Payroll
            </TabsTrigger>
            <TabsTrigger 
              value="attendance"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-300 hover:text-white transition-colors rounded-md"
            >
              Attendance
            </TabsTrigger>
            <TabsTrigger 
              value="leave"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-300 hover:text-white transition-colors rounded-md"
            >
              Leave
            </TabsTrigger>
          </TabsList>

          {/* Staff Directory Tab */}
          <TabsContent value="directory">
            <StaffDirectory />
          </TabsContent>

          {/* Payroll Tab */}
          <TabsContent value="payroll">
            <PayrollManagement />
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <AttendanceManagement />
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
