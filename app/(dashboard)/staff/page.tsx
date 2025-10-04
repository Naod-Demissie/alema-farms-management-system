"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { StaffDirectory } from "./components/staff-directory";
import { AttendanceManagement } from "./components/attendance-management";
import { PayrollManagement } from "./components/payroll-management";
import { LeaveManagement } from "./components/leave-management";
import { StaffInvitations } from "./components/staff-invitations";
import StaffProvider from "@/features/staff/context/staff-context";
import { PageBanner } from "@/components/ui/page-banner";

export default function StaffManagementPage() {
  const [activeTab, setActiveTab] = useState("directory");

  return (
    <StaffProvider>
      <div className="space-y-6">
        {/* Banner Header */}
        <PageBanner
          title="Staff Management"
          description="Manage your staff members, attendance, payroll, and more"
          imageSrc="/banner-bg-image.webp"
        />

        {/* Main Content with Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 h-auto">
            <TabsTrigger value="directory">
              Staffs
            </TabsTrigger>
            <TabsTrigger value="payroll">
              Payroll
            </TabsTrigger>
            <TabsTrigger value="attendance">
              Attendance
            </TabsTrigger>
            <TabsTrigger value="leave">
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
