"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ExpenseTracking } from "./components/expense-tracking";
import { RevenueManagement } from "./components/revenue-management";
import { FinancialReporting } from "./components/financial-reporting";
import { FinancialAnalytics } from "./components/financial-analytics";

export default function FinancialManagementPage() {
  const [activeTab, setActiveTab] = useState("expenses");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Management</h1>
          <p className="text-muted-foreground">
            Track expenses, manage revenue, and generate financial reports for your poultry operation.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="expenses">Expense Tracking</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Management</TabsTrigger>
          <TabsTrigger value="reporting">Financial Reporting</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <ExpenseTracking />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <RevenueManagement />
        </TabsContent>

        <TabsContent value="reporting" className="space-y-4">
          <FinancialReporting />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <FinancialAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
