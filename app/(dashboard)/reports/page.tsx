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
import {
  Download,
  FileText,
  Activity,
  DollarSign,
  Bird,
  Egg,
  Heart,
  Package,
  RefreshCw,
} from "lucide-react";
import { exportData } from "@/lib/export-utils";

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
  const [isExporting, setIsExporting] = useState(false);

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

  const handleExport = async (format: "csv" | "pdf") => {
    setIsExporting(true);
    try {
      // Mock data for export - in a real app, this would come from the current tab's data
      const mockData = [
        { date: "2024-01-01", value: 100, category: "Sample" },
        { date: "2024-01-02", value: 150, category: "Sample" },
        { date: "2024-01-03", value: 200, category: "Sample" },
      ];

      exportData({
        format,
        filename: `${activeTab}-report-${
          new Date().toISOString().split("T")[0]
        }`,
        data: mockData,
        columns: ["date", "value", "category"],
      });
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const reportTabs = [
    {
      id: "financial",
      label: "Financial",
      icon: DollarSign,
      description: "Revenue, expenses, and profitability reports",
    },
    {
      id: "flock",
      label: "Flock Management",
      icon: Bird,
      description: "Flock performance and population analytics",
    },
    {
      id: "production",
      label: "Production",
      icon: Egg,
      description: "Egg production and quality reports",
    },
    {
      id: "feed",
      label: "Feed Management",
      icon: Package,
      description: "Feed usage and inventory reports",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <PageBanner
        title="Reports & Analytics"
        description="Comprehensive reports and analytics for all aspects of your poultry farm"
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
            <h2 className="text-xl font-semibold">Financial Reports</h2>
          </div>
          <FinancialReports filters={filters} />
        </TabsContent>

        {/* Flock Reports */}
        <TabsContent value="flock" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Bird className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Flock Management Reports</h2>
          </div>
          <FlockReports filters={filtersWithStartEndDate} />
        </TabsContent>

        {/* Production Reports */}
        <TabsContent value="production" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Egg className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Production Reports</h2>
          </div>
          <ProductionReports filters={filters} />
        </TabsContent>

        {/* Feed Reports */}
        <TabsContent value="feed" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Feed Management Reports</h2>
          </div>
          <FeedReports filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
