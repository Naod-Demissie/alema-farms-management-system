"use client";

import { useState } from "react";
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ExpenseTracking } from "./components/expenses/expense-tracking";
import { RevenueManagement } from "./components/revenue/revenue-management";
import { PageBanner } from "@/components/ui/page-banner";

export default function FinancialManagementPage() {
  const [activeTab, setActiveTab] = useState("expenses");
  const t = useTranslations('financial');

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <PageBanner
        title={t('title')}
        description={t('description')}
        imageSrc="/banner-bg-image.webp"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expenses">{t('tabs.expenses')}</TabsTrigger>
          <TabsTrigger value="revenue">{t('tabs.revenue')}</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <ExpenseTracking />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <RevenueManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
