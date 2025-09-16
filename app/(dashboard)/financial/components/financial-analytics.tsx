"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Calendar,
  Target,
  AlertTriangle
} from "lucide-react";
import { ExpenseSummary, RevenueSummary, MonthlyFinancialData } from "@/features/financial/types";

interface AnalyticsData {
  expenseSummary: ExpenseSummary[];
  revenueSummary: RevenueSummary[];
  monthlyData: MonthlyFinancialData[];
  totalExpenses: number;
  totalRevenue: number;
  netProfit: number;
  profitMargin: number;
  averageMonthlyProfit: number;
  bestPerformingMonth: MonthlyFinancialData | null;
  worstPerformingMonth: MonthlyFinancialData | null;
}

export function FinancialAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFlock, setSelectedFlock] = useState<string>("");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear() - 1, 0, 1), // Last year
    endDate: new Date(), // Today
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedFlock, dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (selectedFlock) queryParams.append("flockId", selectedFlock);
      if (dateRange.startDate) queryParams.append("startDate", dateRange.startDate.toISOString());
      if (dateRange.endDate) queryParams.append("endDate", dateRange.endDate.toISOString());

      const response = await fetch(`/api/financial/analytics?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (value: number, isPositive: boolean) => {
    if (isPositive) {
      return value > 0 ? "text-green-600" : "text-red-600";
    }
    return value > 0 ? "text-red-600" : "text-green-600";
  };

  const getPerformanceIcon = (value: number, isPositive: boolean) => {
    if (isPositive) {
      return value > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
    }
    return value > 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">No data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Filters</CardTitle>
          <CardDescription>Customize your analytics view</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="flock-filter">Flock</Label>
              <Select
                value={selectedFlock || "all"}
                onValueChange={(value) => setSelectedFlock(value === "all" ? "" : value)}
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
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.startDate.toISOString().split('T')[0]}
                onChange={(e) => setDateRange({ 
                  ...dateRange, 
                  startDate: e.target.value ? new Date(e.target.value) : new Date()
                })}
              />
            </div>

            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.endDate.toISOString().split('T')[0]}
                onChange={(e) => setDateRange({ 
                  ...dateRange, 
                  endDate: e.target.value ? new Date(e.target.value) : new Date()
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(analyticsData.totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(analyticsData.totalExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(analyticsData.netProfit, true)}`}>
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(analyticsData.netProfit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(analyticsData.profitMargin, true)}`}>
              {analyticsData.profitMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-green-800">Best Month</p>
                <p className="text-xs text-green-600">
                  {analyticsData.bestPerformingMonth 
                    ? new Date(analyticsData.bestPerformingMonth.year, parseInt(analyticsData.bestPerformingMonth.month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    : 'N/A'
                  }
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">
                  {analyticsData.bestPerformingMonth 
                    ? new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(analyticsData.bestPerformingMonth.profit)
                    : '$0'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-red-800">Worst Month</p>
                <p className="text-xs text-red-600">
                  {analyticsData.worstPerformingMonth 
                    ? new Date(analyticsData.worstPerformingMonth.year, parseInt(analyticsData.worstPerformingMonth.month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    : 'N/A'
                  }
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-600">
                  {analyticsData.worstPerformingMonth 
                    ? new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(analyticsData.worstPerformingMonth.profit)
                    : '$0'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-blue-800">Average Monthly Profit</p>
                <p className="text-xs text-blue-600">Over selected period</p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${getPerformanceColor(analyticsData.averageMonthlyProfit, true)}`}>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(analyticsData.averageMonthlyProfit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Financial Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Profitability Status</span>
                <Badge variant={analyticsData.netProfit >= 0 ? "default" : "destructive"}>
                  {analyticsData.netProfit >= 0 ? "Profitable" : "Loss Making"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Margin Health</span>
                <Badge variant={
                  analyticsData.profitMargin >= 20 ? "default" : 
                  analyticsData.profitMargin >= 10 ? "secondary" : "destructive"
                }>
                  {analyticsData.profitMargin >= 20 ? "Excellent" : 
                   analyticsData.profitMargin >= 10 ? "Good" : "Needs Improvement"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Trend</span>
                <div className="flex items-center gap-1">
                  {getPerformanceIcon(analyticsData.averageMonthlyProfit, true)}
                  <span className={`text-sm ${getPerformanceColor(analyticsData.averageMonthlyProfit, true)}`}>
                    {analyticsData.averageMonthlyProfit >= 0 ? "Positive" : "Negative"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Expense Breakdown by Category
          </CardTitle>
          <CardDescription>Distribution of expenses across different categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.expenseSummary.map((summary) => (
              <div key={summary.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{summary.category}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {summary.count} records
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(summary.totalAmount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {summary.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${summary.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Revenue Breakdown by Source
          </CardTitle>
          <CardDescription>Distribution of revenue across different sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.revenueSummary.map((summary) => (
              <div key={summary.source} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {summary.source}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {summary.count} records
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(summary.totalAmount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {summary.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${summary.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Financial Trends
          </CardTitle>
          <CardDescription>Revenue, expenses, and profit trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.monthlyData.map((month) => (
              <div key={`${month.year}-${month.month}`} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">
                    {new Date(month.year, parseInt(month.month) - 1).toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </h3>
                  <Badge variant={month.profit >= 0 ? "default" : "destructive"}>
                    {month.profit >= 0 ? "Profitable" : "Loss"}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="font-semibold text-green-600">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(month.revenue)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Expenses</p>
                    <p className="font-semibold text-red-600">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(month.expenses)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Profit</p>
                    <p className={`font-semibold ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(month.profit)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
