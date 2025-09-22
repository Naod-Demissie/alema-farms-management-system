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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="directory">Staffs</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="leave">Leave</TabsTrigger>
          </TabsList>

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
