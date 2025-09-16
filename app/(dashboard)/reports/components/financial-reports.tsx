"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Calendar,
  Target,
  AlertTriangle,
  Download,
  FileText
} from "lucide-react";

interface ReportFilters {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  flockId: string;
  reportType: string;
}

interface FinancialReportsProps {
  filters: ReportFilters;
}

interface FinancialData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  revenueBySource: Array<{
    source: string;
    amount: number;
    percentage: number;
  }>;
  expensesByCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  flockPerformance: Array<{
    flockId: string;
    flockCode: string;
    revenue: number;
    expenses: number;
    profit: number;
    profitMargin: number;
  }>;
}

export function FinancialReports({ filters }: FinancialReportsProps) {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchFinancialData();
  }, [filters]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockData: FinancialData = {
        totalRevenue: 125000,
        totalExpenses: 95000,
        netProfit: 30000,
        profitMargin: 24.0,
        revenueBySource: [
          { source: "Egg Sales", amount: 85000, percentage: 68.0 },
          { source: "Bird Sales", amount: 25000, percentage: 20.0 },
          { source: "Subsidy", amount: 12000, percentage: 9.6 },
          { source: "Other", amount: 3000, percentage: 2.4 }
        ],
        expensesByCategory: [
          { category: "Feed", amount: 45000, percentage: 47.4 },
          { category: "Labor", amount: 20000, percentage: 21.1 },
          { category: "Medicine", amount: 15000, percentage: 15.8 },
          { category: "Utilities", amount: 8000, percentage: 8.4 },
          { category: "Maintenance", amount: 5000, percentage: 5.3 },
          { category: "Other", amount: 2000, percentage: 2.1 }
        ],
        monthlyTrends: [
          { month: "Jan", revenue: 18000, expenses: 14000, profit: 4000 },
          { month: "Feb", revenue: 22000, expenses: 16000, profit: 6000 },
          { month: "Mar", revenue: 25000, expenses: 18000, profit: 7000 },
          { month: "Apr", revenue: 28000, expenses: 20000, profit: 8000 },
          { month: "May", revenue: 30000, expenses: 22000, profit: 8000 },
          { month: "Jun", revenue: 32000, expenses: 24000, profit: 8000 }
        ],
        flockPerformance: [
          { flockId: "1", flockCode: "A-001", revenue: 45000, expenses: 32000, profit: 13000, profitMargin: 28.9 },
          { flockId: "2", flockCode: "B-002", revenue: 38000, expenses: 28000, profit: 10000, profitMargin: 26.3 },
          { flockId: "3", flockCode: "C-003", revenue: 42000, expenses: 35000, profit: 7000, profitMargin: 16.7 }
        ]
      };
      
      setData(mockData);
    } catch (error) {
      console.error("Error fetching financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    console.log(`Exporting financial report as ${format}`);
    // Implement export logic
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No financial data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${data.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${data.totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +8.2% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${data.netProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +18.3% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.profitMargin}%
            </div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
            <TabsTrigger value="expenses">Expense Analysis</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="flocks">Flock Performance</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Revenue by Source
                </CardTitle>
                <CardDescription>Distribution of revenue across different sources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.revenueBySource.map((item) => (
                    <div key={item.source} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.source}</span>
                        <div className="text-right">
                          <div className="font-medium">${item.amount.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">{item.percentage}%</div>
                        </div>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Expenses by Category
                </CardTitle>
                <CardDescription>Distribution of expenses across different categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.expensesByCategory.map((item) => (
                    <div key={item.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.category}</span>
                        <div className="text-right">
                          <div className="font-medium">${item.amount.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">{item.percentage}%</div>
                        </div>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Analysis Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analysis</CardTitle>
              <CardDescription>Detailed breakdown of revenue sources and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data.revenueBySource.map((item) => (
                  <div key={item.source} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{item.source}</h3>
                      <Badge variant="outline">${item.amount.toLocaleString()}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Percentage of total revenue</span>
                      <span>{item.percentage}%</span>
                    </div>
                    <Progress value={item.percentage} className="mt-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expense Analysis Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense Analysis</CardTitle>
              <CardDescription>Detailed breakdown of expense categories and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data.expensesByCategory.map((item) => (
                  <div key={item.category} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{item.category}</h3>
                      <Badge variant="outline">${item.amount.toLocaleString()}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Percentage of total expenses</span>
                      <span>{item.percentage}%</span>
                    </div>
                    <Progress value={item.percentage} className="mt-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Financial Trends</CardTitle>
              <CardDescription>Revenue, expenses, and profit trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.monthlyTrends.map((month) => (
                  <div key={month.month} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{month.month}</h3>
                      <Badge variant={month.profit >= 0 ? "default" : "destructive"}>
                        {month.profit >= 0 ? "Profitable" : "Loss"}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="font-semibold text-green-600">
                          ${month.revenue.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Expenses</p>
                        <p className="font-semibold text-red-600">
                          ${month.expenses.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Profit</p>
                        <p className={`font-semibold ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${month.profit.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flock Performance Tab */}
        <TabsContent value="flocks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Flock Performance</CardTitle>
              <CardDescription>Financial performance by flock</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.flockPerformance.map((flock) => (
                  <div key={flock.flockId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{flock.flockCode}</h3>
                        <p className="text-sm text-muted-foreground">Flock ID: {flock.flockId}</p>
                      </div>
                      <Badge variant={flock.profitMargin >= 20 ? "default" : "secondary"}>
                        {flock.profitMargin}% margin
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="font-semibold text-green-600">
                          ${flock.revenue.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Expenses</p>
                        <p className="font-semibold text-red-600">
                          ${flock.expenses.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Profit</p>
                        <p className={`font-semibold ${flock.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${flock.profit.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
