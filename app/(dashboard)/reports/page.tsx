"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar,
  FileText,
  PieChart,
  Activity,
  DollarSign,
  Users,
  Egg,
  Heart,
  Utensils,
  Filter,
  RefreshCw
} from "lucide-react";
import { exportData } from "@/lib/export-utils";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      startDate: new Date(new Date().getFullYear(), 0, 1), // Start of year
      endDate: new Date(), // Today
    },
    flockId: "",
    reportType: "summary"
  });
  const [isExporting, setIsExporting] = useState(false);

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
      icon: Users,
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
      description: "Health monitoring and mortality reports"
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
          <CardDescription>
            Customize your reports with date ranges and specific criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={filters.dateRange.startDate.toISOString().split('T')[0]}
                onChange={(e) => setFilters({
                  ...filters,
                  dateRange: {
                    ...filters.dateRange,
                    startDate: e.target.value ? new Date(e.target.value) : new Date()
                  }
                })}
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={filters.dateRange.endDate.toISOString().split('T')[0]}
                onChange={(e) => setFilters({
                  ...filters,
                  dateRange: {
                    ...filters.dateRange,
                    endDate: e.target.value ? new Date(e.target.value) : new Date()
                  }
                })}
              />
            </div>
            <div>
              <Label htmlFor="flock-filter">Flock</Label>
              <Select
                value={filters.flockId || "all"}
                onValueChange={(value) => setFilters({
                  ...filters,
                  flockId: value === "all" ? "" : value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Flocks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Flocks</SelectItem>
                  {/* Add flock options here */}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="report-type">Report Type</Label>
              <Select
                value={filters.reportType}
                onValueChange={(value) => setFilters({
                  ...filters,
                  reportType: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="comparative">Comparative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

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
            <Badge variant="outline">Revenue, expenses, and profitability reports</Badge>
          </div>
          <FinancialReports filters={filters} />
        </TabsContent>

        {/* Flock Reports */}
        <TabsContent value="flock" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Flock Management Reports</h2>
            <Badge variant="outline">Flock performance and population analytics</Badge>
          </div>
          <FlockReports filters={filters} />
        </TabsContent>

        {/* Production Reports */}
        <TabsContent value="production" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Egg className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Production Reports</h2>
            <Badge variant="outline">Egg production and quality reports</Badge>
          </div>
          <ProductionReports filters={filters} />
        </TabsContent>

        {/* Health Reports */}
        <TabsContent value="health" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Health & Mortality Reports</h2>
            <Badge variant="outline">Health monitoring and mortality reports</Badge>
          </div>
          <HealthReports filters={filters} />
        </TabsContent>

        {/* Staff Reports */}
        <TabsContent value="staff" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Staff Management Reports</h2>
            <Badge variant="outline">Attendance, payroll, and productivity reports</Badge>
          </div>
          <StaffReports filters={filters} />
        </TabsContent>

        {/* Feed Reports */}
        <TabsContent value="feed" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Utensils className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Feed Management Reports</h2>
            <Badge variant="outline">Feed usage and inventory reports</Badge>
          </div>
          <FeedReports filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
