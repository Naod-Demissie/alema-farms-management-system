"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  FileText,
  Activity,
  DollarSign,
  Bird,
  Egg,
  Heart,
  Utensils,
  RefreshCw
} from "lucide-react";
import { exportData } from "@/lib/export-utils";

// Import report components
import { FinancialReports } from "./components/financial-reports";
import { FlockReports } from "./components/flock-reports";
import { ProductionReports } from "./components/production-reports";
import { HealthReports } from "./components/health-reports";
import { StaffReports } from "./components/staff-reports";
import { FeedReports } from "./components/feed-reports";

interface ReportFilters {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  flockId: string;
  reportType: string;
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("financial");
  const [isExporting, setIsExporting] = useState(false);
  
  // Default filters - no longer editable since filter card is removed
  const filters: ReportFilters = {
    dateRange: {
      startDate: new Date(new Date().getFullYear(), 0, 1), // Start of year
      endDate: new Date(), // Today
    },
    flockId: "",
    reportType: "summary"
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      // Mock data for export - in a real app, this would come from the current tab's data
      const mockData = [
        { date: '2024-01-01', value: 100, category: 'Sample' },
        { date: '2024-01-02', value: 150, category: 'Sample' },
        { date: '2024-01-03', value: 200, category: 'Sample' }
      ];
      
      exportData({
        format,
        filename: `${activeTab}-report-${new Date().toISOString().split('T')[0]}`,
        data: mockData,
        columns: ['date', 'value', 'category']
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
      description: "Revenue, expenses, and profitability reports"
    },
    {
      id: "flock",
      label: "Flock Management",
      icon: Bird,
      description: "Flock performance and population analytics"
    },
    {
      id: "production",
      label: "Production",
      icon: Egg,
      description: "Egg production and quality reports"
    },
    {
      id: "health",
      label: "Health & Mortality",
      icon: Heart,
      description: "Health and mortality reports"
    },
    {
      id: "staff",
      label: "Staff Management",
      icon: Activity,
      description: "Attendance, payroll, and productivity reports"
    },
    {
      id: "feed",
      label: "Feed Management",
      icon: Utensils,
      description: "Feed usage and inventory reports"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive reports and analytics for all aspects of your poultry farm
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button 
            onClick={() => handleExport('csv')} 
            disabled={isExporting}
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button 
            onClick={() => handleExport('pdf')} 
            disabled={isExporting}
          >
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>


      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          {reportTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
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
          <FlockReports filters={filters} />
        </TabsContent>

        {/* Production Reports */}
        <TabsContent value="production" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Egg className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Production Reports</h2>
          </div>
          <ProductionReports filters={filters} />
        </TabsContent>

        {/* Health Reports */}
        <TabsContent value="health" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Health & Mortality Reports</h2>
          </div>
          <HealthReports filters={filters} />
        </TabsContent>

        {/* Staff Reports */}
        <TabsContent value="staff" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Staff Management Reports</h2>
          </div>
          <StaffReports filters={filters} />
        </TabsContent>

        {/* Feed Reports */}
        <TabsContent value="feed" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Utensils className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Feed Management Reports</h2>
          </div>
          <FeedReports filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
