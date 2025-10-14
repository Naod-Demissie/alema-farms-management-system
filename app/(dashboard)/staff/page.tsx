"use client";

import { useState } from "react";
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { StaffDirectory } from "./components/directory/staff-directory";
import { AttendanceManagement } from "./components/attendance/attendance-management";
import { PayrollManagement } from "./components/payroll/payroll-management";
import { LeaveManagement } from "./components/leave/leave-management";
import { StaffInvitations } from "./components/invitations/staff-invitations";
import StaffProvider from "./context/staff-context";
import { PageBanner } from "@/components/ui/page-banner";

export default function StaffManagementPage() {
  const [activeTab, setActiveTab] = useState("directory");
  const t = useTranslations('staff');

  return (
    <StaffProvider>
      <div className="space-y-6">
        {/* Banner Header */}
        <PageBanner
          title={t('title')}
          description={t('description')}
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
              {t('name')}
            </TabsTrigger>
            <TabsTrigger value="payroll">
              {t('payroll.title')}
            </TabsTrigger>
            <TabsTrigger value="attendance">
              {t('attendance.title')}
            </TabsTrigger>
            <TabsTrigger value="leave">
              {t('leave.title')}
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
