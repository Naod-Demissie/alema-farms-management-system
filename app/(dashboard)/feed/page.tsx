"use client";

import React, { useState } from "react";
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedInventory } from "./components/inventory/feed-inventory";
import { FeedUsage } from "./components/usage/feed-usage";
import { FeedSuppliers } from "./components/suppliers/feed-suppliers";
import { FeedProgram } from "./components/program/feed-program";
import { FeedPlanning } from "./components/planning/feed-planning";
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
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1 h-auto">
          <TabsTrigger value="usage">{t('usage.title')}</TabsTrigger>
          <TabsTrigger value="planning">{t('planning.title')}</TabsTrigger>
          <TabsTrigger value="inventory">{t('inventory.title')}</TabsTrigger>
          <TabsTrigger value="suppliers">{t('suppliers.title')}</TabsTrigger>
          <TabsTrigger value="program">{t('program.title')}</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4 mt-4 sm:mt-0">
          <FeedUsage />
        </TabsContent>

        <TabsContent value="planning" className="space-y-4 mt-4 sm:mt-0">
          <FeedPlanning />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4 mt-4 sm:mt-0">
          <FeedInventory />
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4 mt-4 sm:mt-0">
          <FeedSuppliers />
        </TabsContent>

        <TabsContent value="program" className="space-y-4 mt-4 sm:mt-0">
          <FeedProgram />
        </TabsContent>
      </Tabs>
    </div>
  );
}
