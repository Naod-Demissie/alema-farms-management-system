"use client";

import React, { useState } from "react";
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedUsage } from "./components/usage/feed-usage";
import { FeedPlanningManagement } from "./components/planning/feed-planning-management";
import { FeedInventoryManagement } from "./components/inventory/feed-inventory-management";
import { WaterConsumption } from "./components/water/water-consumption";
import { FeedAnalyticsManagement } from "./components/analytics/feed-analytics-management";
import { PageBanner } from "@/components/ui/page-banner";

export default function FeedManagementPage() {
  const [activeTab, setActiveTab] = useState("usage");
  const t = useTranslations('feed');

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <PageBanner
        title={t('title')}
        description={t('description')}
        imageSrc="/banner-bg-image.webp"
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4 sm:space-y-0"
      >
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-1 h-auto">
          <TabsTrigger value="usage">{t('usage.title')}</TabsTrigger>
          <TabsTrigger value="planning">{t('planning.title')}</TabsTrigger>
          <TabsTrigger value="inventory">{t('inventory.title')}</TabsTrigger>
          <TabsTrigger value="water">{t('water.title')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('analytics.title')}</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4 mt-4 sm:mt-0">
          <FeedUsage />
        </TabsContent>

        <TabsContent value="planning" className="space-y-4 mt-4 sm:mt-0">
          <FeedPlanningManagement />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4 mt-4 sm:mt-0">
          <FeedInventoryManagement />
        </TabsContent>

        <TabsContent value="water" className="space-y-4 mt-4 sm:mt-0">
          <WaterConsumption />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 mt-4 sm:mt-0">
          <FeedAnalyticsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
