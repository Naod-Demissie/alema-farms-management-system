"use client";

import { useState } from "react";
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Activity,
  DollarSign,
  Bird,
  Egg,
  Heart,
  Package,
  RefreshCw,
} from "lucide-react";

// Import report components
import { FinancialReports } from "./components/financial-reports";
import { FlockReports } from "./components/flock-reports";
import { ProductionReports } from "./components/production-reports";
import { FeedReports } from "./components/feed-reports";
import { PageBanner } from "@/components/ui/page-banner";

interface ReportFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  flockId: string;
  reportType: string;
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("financial");
  const t = useTranslations('reports');

  // Default filters - no longer editable since filter card is removed
  const filters = {
    dateRange: {
      start: new Date(new Date().getFullYear(), 0, 1), // Start of year
      end: new Date(), // Today
    },
    flockId: "",
    reportType: "summary",
  };

  // Convert filters for components that expect startDate/endDate
  const filtersWithStartEndDate = {
    dateRange: {
      startDate: filters.dateRange.start,
      endDate: filters.dateRange.end,
    },
    flockId: filters.flockId,
    reportType: filters.reportType,
  };

  const reportTabs = [
    {
      id: "financial",
      label: t('tabs.financial'),
      icon: DollarSign,
      description: t('tabs.financialDesc'),
    },
    {
      id: "flock",
      label: t('tabs.flock'),
      icon: Bird,
      description: t('tabs.flockDesc'),
    },
    {
      id: "production",
      label: t('tabs.production'),
      icon: Egg,
      description: t('tabs.productionDesc'),
    },
    {
      id: "feed",
      label: t('tabs.feed'),
      icon: Package,
      description: t('tabs.feedDesc'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <PageBanner
        title={t('title')}
        description={t('description')}
        imageSrc="/banner-bg-image.webp"
      />

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 h-auto">
          {reportTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4 hidden sm:inline" />
                <span>{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Financial Reports */}
        <TabsContent value="financial" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5" />
            <h2 className="text-xl font-semibold">{t('headers.financial')}</h2>
          </div>
          <FinancialReports filters={filters} />
        </TabsContent>

        {/* Flock Reports */}
        <TabsContent value="flock" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Bird className="h-5 w-5" />
            <h2 className="text-xl font-semibold">{t('headers.flock')}</h2>
          </div>
          <FlockReports filters={filtersWithStartEndDate} />
        </TabsContent>

        {/* Production Reports */}
        <TabsContent value="production" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Egg className="h-5 w-5" />
            <h2 className="text-xl font-semibold">{t('headers.production')}</h2>
          </div>
          <ProductionReports filters={filters} />
        </TabsContent>

        {/* Feed Reports */}
        <TabsContent value="feed" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5" />
            <h2 className="text-xl font-semibold">{t('headers.feed')}</h2>
          </div>
          <FeedReports filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
