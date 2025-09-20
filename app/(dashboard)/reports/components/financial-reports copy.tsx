"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Calendar,
  Download,
  Target,
  AlertTriangle,
  Activity
} from "lucide-react";
import { FlockFinancialSummary, MonthlyFinancialData, ExpenseSummary, RevenueSummary } from "@/features/financial/types";
import { 
  getFlockFinancialSummaries, 
  getMonthlyFinancialData,
  getExpenseSummary,
  getRevenueSummary,
  getFinancialSummary
} from "@/server/financial";
import { toast } from "sonner";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartLegend, 
  ChartLegendContent,
  ChartConfig
} from "@/components/ui/chart";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ComposedChart,
  Label
} from "recharts";

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


export function FinancialReports({ filters }: FinancialReportsProps) {
  const [flockFinancials, setFlockFinancials] = useState<FlockFinancialSummary[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyFinancialData[]>([]);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary[]>([]);
  const [revenueSummary, setRevenueSummary] = useState<RevenueSummary[]>([]);
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Separate state for each chart's data
  const [revenueChartMonthlyData, setRevenueChartMonthlyData] = useState<MonthlyFinancialData[]>([]);
  const [flockChartFinancials, setFlockChartFinancials] = useState<FlockFinancialSummary[]>([]);
  const [revenueTimeFilter, setRevenueTimeFilter] = useState<string>("3months");
  const [flockTimeFilter, setFlockTimeFilter] = useState<string>("3months");
  const [revenuePieTimeFilter, setRevenuePieTimeFilter] = useState<string>("3months");
  const [expensePieTimeFilter, setExpensePieTimeFilter] = useState<string>("3months");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1),
    endDate: new Date(),
  });

  // Chart configuration with darker green and red colors
  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "#16a34a", // darker green
    },
    expenses: {
      label: "Expenses", 
      color: "#dc2626", // darker red
    },
    net: {
      label: "Net",
      color: "#16a34a", // will be overridden based on positive/negative
    },
  } satisfies ChartConfig;

  // Calculate date range based on time filter
  const getDateRangeForFilter = (timeFilter: string) => {
    const now = new Date();
    let startDate: Date;

    switch (timeFilter) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "3months":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate: now };
  };


  // Initialize chart data on component mount
  useEffect(() => {
    const initializeChartData = async () => {
      try {
        // Initialize revenue chart data
        const { startDate: revenueStart, endDate: revenueEnd } = getDateRangeForFilter(revenueTimeFilter);
        const revenueFilters = {
          startDate: revenueStart,
          endDate: revenueEnd,
        };
        const [revenueResult] = await Promise.all([getMonthlyFinancialData(revenueFilters)]);
        if (revenueResult.success) {
          setRevenueChartMonthlyData(revenueResult.data || []);
        }

        // Initialize flock chart data
        const { startDate: flockStart, endDate: flockEnd } = getDateRangeForFilter(flockTimeFilter);
        const flockFilters = {
          startDate: flockStart,
          endDate: flockEnd,
        };
        const [flockResult] = await Promise.all([getFlockFinancialSummaries(flockFilters)]);
        if (flockResult.success) {
          setFlockChartFinancials(flockResult.data || []);
        }
      } catch (error) {
        console.error("Error initializing chart data:", error);
      }
    };

    initializeChartData();
  }, []);

  useEffect(() => {
    fetchFinancialData();
  }, [dateRange]);

  // Refetch data when individual chart time filters change
  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        const { startDate, endDate } = getDateRangeForFilter(revenueTimeFilter);
        const filters = {
          startDate,
          endDate,
        };

        const [monthlyResult] = await Promise.all([
          getMonthlyFinancialData(filters),
        ]);

        if (monthlyResult.success) {
          setRevenueChartMonthlyData(monthlyResult.data || []);
        }
      } catch (error) {
        console.error("Error fetching revenue data:", error);
      }
    };

    fetchRevenueData();
  }, [revenueTimeFilter]);

  useEffect(() => {
    const fetchFlockData = async () => {
      try {
        const { startDate, endDate } = getDateRangeForFilter(flockTimeFilter);
        const filters = {
          startDate,
          endDate,
        };

        const [flockResult] = await Promise.all([
          getFlockFinancialSummaries(filters),
        ]);

        if (flockResult.success) {
          setFlockChartFinancials(flockResult.data || []);
        }
      } catch (error) {
        console.error("Error fetching flock data:", error);
      }
    };

    fetchFlockData();
  }, [flockTimeFilter]);



  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const filters = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };

      const [flockResult, monthlyResult, expenseResult, revenueResult, summaryResult] = await Promise.all([
        getFlockFinancialSummaries(filters),
        getMonthlyFinancialData(filters),
        getExpenseSummary(filters),
        getRevenueSummary(filters),
        getFinancialSummary(filters)
      ]);

      if (flockResult.success) {
        setFlockFinancials(flockResult.data || []);
      }
      if (monthlyResult.success) {
        setMonthlyData(monthlyResult.data || []);
      }
      if (expenseResult.success) {
        setExpenseSummary(expenseResult.data || []);
      }
      if (revenueResult.success) {
        setRevenueSummary(revenueResult.data || []);
      }
      if (summaryResult.success) {
        setFinancialSummary(summaryResult.data);
      }
    } catch (error) {
      console.error("Error fetching financial data:", error);
      toast.error("Failed to fetch financial data");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const queryParams = new URLSearchParams();
      if (dateRange.startDate) queryParams.append("startDate", dateRange.startDate.toISOString());
      if (dateRange.endDate) queryParams.append("endDate", dateRange.endDate.toISOString());
      queryParams.append("format", format);

      const response = await fetch(`/api/financial/reports/export?${queryParams}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financial-report-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exporting report:", error);
    }
  };

  const totalExpenses = financialSummary?.totalExpenses || 0;
  const totalRevenue = financialSummary?.totalRevenue || 0;
  const totalProfit = financialSummary?.netProfit || 0;
  const profitMargin = financialSummary?.profitMargin || 0;

  // Prepare revenue vs expenses chart data (categories instead of dates)
  const getRevenueExpenseData = () => {
    // Use the chart-specific data that's already filtered by time
    const totalRevenue = revenueChartMonthlyData.reduce((sum, m) => sum + m.revenue, 0);
    const totalExpenses = revenueChartMonthlyData.reduce((sum, m) => sum + m.expenses, 0);
    const net = totalRevenue - totalExpenses;
    
    return [
      {
        category: "Revenue",
        revenue: Math.abs(totalRevenue),
        expenses: 0,
        net: 0,
        netIsPositive: true,
        netColor: "#16a34a"
      },
      {
        category: "Expenses", 
        revenue: 0,
        expenses: Math.abs(totalExpenses),
        net: 0,
        netIsPositive: true,
        netColor: "#16a34a"
      },
      {
        category: "Profit",
        revenue: 0,
        expenses: 0,
        net: Math.abs(net),
        netIsPositive: net >= 0,
        netColor: net >= 0 ? "#16a34a" : "#dc2626"
      }
    ];
  };

  // Prepare flock performance chart data with real flock IDs
  const getFlockPerformanceData = () => {
    // Use the chart-specific data that's already filtered by time
    return flockChartFinancials.map(flock => {
      const revenue = flock.totalRevenue;
      const expenses = flock.totalExpenses;
      const net = flock.netProfit;
      return {
        category: flock.batchCode, // Use real flock ID
        revenue: Math.abs(revenue),
        expenses: Math.abs(expenses),
        net: Math.abs(net),
        netIsPositive: net >= 0,
        netColor: net >= 0 ? "#16a34a" : "#dc2626"
      };
    });
  };

  const revenueChartData = getRevenueExpenseData();
  const flockChartData = getFlockPerformanceData();

  const expensePieChartData = expenseSummary.map(expense => ({
    category: expense.category,
    amount: expense.totalAmount,
    percentage: expense.percentage
  }));

  const revenuePieChartData = revenueSummary.map(revenue => ({
    source: revenue.source,
    amount: revenue.totalAmount,
    percentage: revenue.percentage
  }));


  // Interactive Bar Chart Component
  const ChartBarInteractive = ({ title, description, data, config, timeRange, setTimeRange }: any) => {
    const total = React.useMemo(
      () => ({
        revenue: data.reduce((acc: number, curr: any) => acc + curr.revenue, 0),
        expenses: data.reduce((acc: number, curr: any) => acc + curr.expenses, 0),
        net: data.reduce((acc: number, curr: any) => acc + curr.net, 0),
      }),
      [data]
    );

  return (
      <Card className="pt-0">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
              aria-label="Select a time range"
            >
              <SelectValue placeholder="Last 3 months" />
                </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="3months" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="month" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="week" className="rounded-lg">
                Last 7 days
                    </SelectItem>
                </SelectContent>
              </Select>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
          <ChartContainer
            config={config}
            className="aspect-auto h-[250px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={data}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[150px]"
                  />
                }
              />
              <Bar dataKey="revenue" fill="#16a34a" radius={4} />
              <Bar dataKey="expenses" fill="#dc2626" radius={4} />
              <Bar dataKey="net" fill="#16a34a" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Export Controls */}
      <div className="flex items-center justify-end">
        <div className="flex gap-2">
          <Button onClick={() => handleExport('csv')} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
            CSV
              </Button>
          <Button onClick={() => handleExport('pdf')} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
            PDF
              </Button>
            </div>
          </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
                   <div className="text-2xl font-bold text-green-600">
                     {new Intl.NumberFormat("en-ET", {
                       style: "currency",
                       currency: "ETB",
                     }).format(totalRevenue)}
                   </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
                   <div className="text-2xl font-bold text-red-600">
                     {new Intl.NumberFormat("en-ET", {
                       style: "currency",
                       currency: "ETB",
                     }).format(totalExpenses)}
                   </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-600'}`}>
                     {new Intl.NumberFormat("en-ET", {
                       style: "currency",
                       currency: "ETB",
                     }).format(totalProfit)}
                   </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <Target className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-green-400' : 'text-red-600'}`}>
              {profitMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2 Bar Charts on Top */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses Bar Chart */}
        <ChartBarInteractive
          title="Revenue vs Expenses"
          description="Showing revenue and expense trends over time"
          data={revenueChartData}
          config={chartConfig}
          timeRange={revenueTimeFilter}
          setTimeRange={setRevenueTimeFilter}
        />

        {/* Flock Performance Bar Chart */}
        <ChartBarInteractive
          title="Flock Performance"
          description="Revenue, expenses, and net profit comparison across flocks"
          data={flockChartData}
          config={chartConfig}
          timeRange={flockTimeFilter}
          setTimeRange={setFlockTimeFilter}
        />
                      </div>
                      
      {/* 2 Pie Charts in Same Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown Pie Chart */}
        <Card className="pt-0">
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Revenue distribution by source</CardDescription>
                        </div>
            <Select value={revenuePieTimeFilter} onValueChange={setRevenuePieTimeFilter}>
              <SelectTrigger
                className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
                aria-label="Select a time range"
              >
                <SelectValue placeholder="Last 3 months" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="3months" className="rounded-lg">
                  Last 3 months
                </SelectItem>
                <SelectItem value="month" className="rounded-lg">
                  Last 30 days
                </SelectItem>
                <SelectItem value="week" className="rounded-lg">
                  Last 7 days
                </SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="px-2 sm:p-6">
            <ChartContainer
              config={{
                amount: {
                  label: "Revenue Amount",
                },
                ...revenuePieChartData.reduce((acc, item, index) => {
                  const colors = ["#86efac", "#4ade80", "#22c55e", "#16a34a", "#15803d"];
                  acc[item.source] = {
                    label: item.source.replace('_', ' ').toUpperCase(),
                    color: colors[index % colors.length],
                  };
                  return acc;
                }, {} as any)
              }}
              className="mx-auto aspect-square max-h-[250px]"
            >
              <RechartsPieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={revenuePieChartData.map((item, index) => {
                    const colors = ["#86efac", "#4ade80", "#22c55e", "#16a34a", "#15803d"];
                    return {
                      ...item,
                      fill: colors[index % colors.length]
                    };
                  })}
                  dataKey="amount"
                  nameKey="source"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        const totalRevenue = revenuePieChartData.reduce((acc, curr) => acc + curr.amount, 0);
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {totalRevenue.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              ETB
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </RechartsPieChart>
            </ChartContainer>
          </CardContent>
          <div className="flex-col gap-2 text-sm px-6 pb-6">
            <div className="flex items-center gap-2 leading-none font-medium">
              <TrendingUp className="h-4 w-4" />
              {revenuePieChartData[0]?.source?.replace('_', ' ').toUpperCase()} leading with {revenuePieChartData[0]?.percentage?.toFixed(1)}%
                    </div>
            <div className="text-muted-foreground leading-none">
              Showing distribution across {revenuePieChartData.length} revenue sources
                        </div>
                      </div>
                    </Card>

        {/* Expense Breakdown Pie Chart */}
        <Card className="pt-0">
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle>Expense Breakdown</CardTitle>
              <CardDescription>Expense distribution by category</CardDescription>
                </div>
            <Select value={expensePieTimeFilter} onValueChange={setExpensePieTimeFilter}>
              <SelectTrigger
                className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
                aria-label="Select a time range"
              >
                <SelectValue placeholder="Last 3 months" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="3months" className="rounded-lg">
                  Last 3 months
                </SelectItem>
                <SelectItem value="month" className="rounded-lg">
                  Last 30 days
                </SelectItem>
                <SelectItem value="week" className="rounded-lg">
                  Last 7 days
                </SelectItem>
              </SelectContent>
            </Select>
            </CardHeader>
          <CardContent className="px-2 sm:p-6">
            <ChartContainer
              config={{
                amount: {
                  label: "Expense Amount",
                },
                ...expensePieChartData.reduce((acc, item, index) => {
                  const colors = ["#fca5a5", "#f87171", "#ef4444", "#dc2626", "#b91c1c"];
                  acc[item.category] = {
                    label: item.category.replace('_', ' ').toUpperCase(),
                    color: colors[index % colors.length],
                  };
                  return acc;
                }, {} as any)
              }}
              className="mx-auto aspect-square max-h-[250px]"
            >
              <RechartsPieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={expensePieChartData.map((item, index) => {
                    const colors = ["#fca5a5", "#f87171", "#ef4444", "#dc2626", "#b91c1c"];
                    return {
                      ...item,
                      fill: colors[index % colors.length]
                    };
                  })}
                  dataKey="amount"
                  nameKey="category"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        const totalExpenses = expensePieChartData.reduce((acc, curr) => acc + curr.amount, 0);
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {totalExpenses.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              ETB
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </RechartsPieChart>
            </ChartContainer>
            </CardContent>
          <div className="flex-col gap-2 text-sm px-6 pb-6">
            <div className="flex items-center gap-2 leading-none font-medium">
              <TrendingDown className="h-4 w-4" />
              {expensePieChartData[0]?.category?.replace('_', ' ').toUpperCase()} leading with {expensePieChartData[0]?.percentage?.toFixed(1)}%
                  </div>
            <div className="text-muted-foreground leading-none">
              Showing distribution across {expensePieChartData.length} expense categories
                  </div>
              </div>
          </Card>
          </div>
    </div>
  );
}