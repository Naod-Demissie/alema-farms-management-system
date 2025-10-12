"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  Target,
} from "lucide-react";
import {
  FlockFinancialSummary,
  MonthlyFinancialData,
  ExpenseSummary,
  RevenueSummary,
} from "@/app/(dashboard)/financial/types/types";
import {
  getFlockFinancialSummaries,
  getMonthlyFinancialData,
  getDailyFinancialData,
  getExpenseSummary,
  getRevenueSummary,
  getFinancialSummary,
} from "@/app/(dashboard)/financial/server/financial";
import { toast } from "sonner";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Label,
  AreaChart,
  Area,
  YAxis,
} from "recharts";

interface ReportFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  flockId: string;
  reportType: string;
}

interface FinancialReportsProps {
  filters: ReportFilters;
}

export function FinancialReports({ filters }: FinancialReportsProps) {
  const [flockFinancials, setFlockFinancials] = useState<
    FlockFinancialSummary[]
  >([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyFinancialData[]>([]);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary[]>([]);
  const [revenueSummary, setRevenueSummary] = useState<RevenueSummary[]>([]);
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Chart-specific state
  const [revenueChartDailyData, setRevenueChartDailyData] = useState<any[]>([]);
  const [revenuePieTimeFilter, setRevenuePieTimeFilter] =
    useState<string>("3months");
  const [expensePieTimeFilter, setExpensePieTimeFilter] =
    useState<string>("3months");
  const [areaChartTimeFilter, setAreaChartTimeFilter] = useState<string>("3months");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1),
    endDate: new Date(),
  });

  // Chart configuration colors
  const chartConfig = {
    revenue: { label: "Revenue", color: "#16a34a" },
    expenses: { label: "Expenses", color: "#dc2626" },
    net: { label: "Net Profit", color: "#2563eb" },
  } satisfies ChartConfig;

  // Helper: map time filter to date range
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

  // Fetch main lists whenever the global dateRange changes
  useEffect(() => {
    fetchFinancialData();
  }, [dateRange]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const filters = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };

      const [
        flockResult,
        monthlyResult,
        expenseResult,
        revenueResult,
        summaryResult,
      ] = await Promise.all([
        getFlockFinancialSummaries(filters),
        getMonthlyFinancialData(filters),
        getExpenseSummary(filters),
        getRevenueSummary(filters),
        getFinancialSummary(filters),
      ]);

      if (flockResult.success) setFlockFinancials(flockResult.data || []);
      if (monthlyResult.success)
        setMonthlyData(normalizeMonthlyData(monthlyResult.data || []));
      if (expenseResult.success) setExpenseSummary(expenseResult.data || []);
      if (revenueResult.success) setRevenueSummary(revenueResult.data || []);
      if (summaryResult.success) setFinancialSummary(summaryResult.data);
    } catch (error) {
      console.error("Error fetching financial data:", error);
      toast.error("Failed to fetch financial data");
    } finally {
      setLoading(false);
    }
  };

  // Normalize monthly data to ensure numeric values (defensive)
  const normalizeMonthlyData = (arr: any[]): MonthlyFinancialData[] => {
    return arr.map((m) => ({
      ...m,
      revenue: Number(m.revenue || 0),
      expenses: Number(m.expenses || 0),
    }));
  };


  // Fetch pie breakdowns when their filters change
  useEffect(() => {
    const fetchRevenueBreakdown = async () => {
      try {
        const { startDate, endDate } =
          getDateRangeForFilter(revenuePieTimeFilter);
        const res = await getRevenueSummary({ startDate, endDate });
        if (res.success) setRevenueSummary(res.data || []);
        else setRevenueSummary([]);
      } catch (err) {
        console.error("Error fetching revenue breakdown:", err);
        setRevenueSummary([]);
      }
    };
    fetchRevenueBreakdown();
  }, [revenuePieTimeFilter]);

  useEffect(() => {
    const fetchExpenseBreakdown = async () => {
      try {
        const { startDate, endDate } =
          getDateRangeForFilter(expensePieTimeFilter);
        const res = await getExpenseSummary({ startDate, endDate });
        if (res.success) setExpenseSummary(res.data || []);
        else setExpenseSummary([]);
      } catch (err) {
        console.error("Error fetching expense breakdown:", err);
        setExpenseSummary([]);
      }
    };
    fetchExpenseBreakdown();
  }, [expensePieTimeFilter]);

  // Fetch area chart data when areaChartTimeFilter changes
  useEffect(() => {
    const fetchAreaChartData = async () => {
      try {
        const { startDate, endDate } = getDateRangeForFilter(areaChartTimeFilter);
        const res = await getDailyFinancialData({ startDate, endDate });
        if (res.success) {
          setRevenueChartDailyData(res.data || []);
        } else {
          setRevenueChartDailyData([]);
        }
      } catch (err) {
        console.error("Error fetching area chart data:", err);
        setRevenueChartDailyData([]);
      }
    };
    fetchAreaChartData();
  }, [areaChartTimeFilter]);

  // Summary numbers
  const totalExpenses = financialSummary?.totalExpenses || 0;
  const totalRevenue = financialSummary?.totalRevenue || 0;
  const totalProfit = financialSummary?.netProfit || 0;
  const profitMargin = financialSummary?.profitMargin || 0;


  // Area chart data: transform daily data for area chart
  const getAreaChartData = () => {
    return revenueChartDailyData.map((dayData) => ({
      date: dayData.date,
      revenue: Number(dayData.revenue || 0),
      expenses: Number(dayData.expenses || 0),
      net: Number(dayData.profit || 0),
    }));
  };

  const areaChartData = getAreaChartData();

  // Pie data mapping
  const expensePieChartData = expenseSummary.map((exp) => ({
    category: exp.category,
    amount: Number(exp.totalAmount || 0),
    percentage: Number(exp.percentage || 0),
  }));

  const revenuePieChartData = revenueSummary.map((r) => ({
    source: r.source,
    amount: Number(r.totalAmount || 0),
    percentage: Number(r.percentage || 0),
  }));


  // Area Chart Component for Revenue, Expenses, and Net Profit
  const FinancialAreaChart = ({
    title,
    description,
    data,
    config,
    timeRange,
    setTimeRange,
  }: any) => {
    const financialMetrics = [
      { key: "revenue", label: "Revenue", color: "#16a34a" },
      { key: "expenses", label: "Expenses", color: "#dc2626" },
      { key: "net", label: "Net Profit", color: "#2563eb" }
    ];

    return (
      <Card className="pt-0">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="w-[160px] rounded-lg sm:ml-auto"
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
              revenue: { label: "Revenue", color: "#16a34a" },
              expenses: { label: "Expenses", color: "#dc2626" },
              net: { label: "Net Profit", color: "#2563eb" }
            }}
            className="aspect-auto h-[300px] w-full"
          >
            <AreaChart data={data}>
              <defs>
                {financialMetrics.map((metric, index) => (
                  <linearGradient key={`fill${metric.key}`} id={`fill${metric.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={metric.color}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={metric.color}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                    formatter={(value, name) => [
                      new Intl.NumberFormat("en-ET", {
                        style: "currency",
                        currency: "ETB",
                      }).format(Number(value)),
                      name,
                    ]}
                    indicator="dot"
                  />
                }
              />
              {financialMetrics.map((metric, index) => (
                <Area
                  key={metric.key}
                  dataKey={metric.key}
                  type="linear"
                  fill={`url(#fill${metric.key})`}
                  stroke={metric.color}
                  stackId="a"
                />
              ))}
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold text-green-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat("en-ET", {
                  style: "currency",
                  currency: "ETB",
                }).format(totalRevenue)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold text-red-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {new Intl.NumberFormat("en-ET", {
                  style: "currency",
                  currency: "ETB",
                }).format(totalExpenses)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div
                className={`text-2xl font-bold ${
                  totalProfit >= 0 ? "text-green-500" : "text-red-600"
                }`}
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div
                className={`text-2xl font-bold ${
                  totalProfit >= 0 ? "text-green-500" : "text-red-600"
                }`}
              >
                {new Intl.NumberFormat("en-ET", {
                  style: "currency",
                  currency: "ETB",
                }).format(totalProfit)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <Target className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div
                className={`text-2xl font-bold ${
                  profitMargin >= 0 ? "text-green-400" : "text-red-600"
                }`}
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div
                className={`text-2xl font-bold ${
                  profitMargin >= 0 ? "text-green-400" : "text-red-600"
                }`}
              >
                {Number(profitMargin || 0).toFixed(1)}%
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview Area Chart */}
      <FinancialAreaChart
        title="Financial Overview"
        description="Revenue, expenses, and net profit trends over time"
        data={areaChartData}
          config={chartConfig}
        timeRange={areaChartTimeFilter}
        setTimeRange={setAreaChartTimeFilter}
      />

      {/* Pie charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <Card className="pt-0">
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Revenue distribution by source</CardDescription>
            </div>

            <Select
              value={revenuePieTimeFilter}
              onValueChange={(v) => setRevenuePieTimeFilter(v)}
            >
              <SelectTrigger
                className="w-[160px] rounded-lg sm:ml-auto sm:flex"
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
                amount: { label: "Revenue Amount" },
                ...revenuePieChartData.reduce((acc: any, item, index) => {
                  const colors = [
                    "#86efac",
                    "#4ade80",
                    "#22c55e",
                    "#16a34a",
                    "#15803d",
                  ];
                  acc[item.source] = {
                    label: item.source?.replace("_", " ").toUpperCase(),
                    color: colors[index % colors.length],
                  };
                  return acc;
                }, {}),
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
                    const colors = [
                      "#86efac",
                      "#4ade80",
                      "#22c55e",
                      "#16a34a",
                      "#15803d",
                    ];
                    return { ...item, fill: colors[index % colors.length] };
                  })}
                  dataKey="amount"
                  nameKey="source"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        const totalRevenue = revenuePieChartData.reduce(
                          (acc, curr) => acc + curr.amount,
                          0
                        );
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
                      return null;
                    }}
                  />
                </Pie>
              </RechartsPieChart>
            </ChartContainer>
          </CardContent>

          <div className="flex-col gap-2 text-sm px-6 pb-6 text-center">
            <div className="flex items-center justify-center gap-2 leading-none font-medium">
              <TrendingUp className="h-4 w-4" />
              {revenuePieChartData[0]?.source
                ?.replace("_", " ")
                .toUpperCase() ?? "—"}{" "}
              leading with{" "}
              {revenuePieChartData[0]?.percentage?.toFixed(1) ?? "0.0"}%
            </div>
            <div className="text-muted-foreground leading-none">
              Showing distribution across {revenuePieChartData.length} revenue
              sources
            </div>
          </div>
        </Card>

        {/* Expense Breakdown */}
        <Card className="pt-0">
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle>Expense Breakdown</CardTitle>
              <CardDescription>
                Expense distribution by category
              </CardDescription>
            </div>

            <Select
              value={expensePieTimeFilter}
              onValueChange={(v) => setExpensePieTimeFilter(v)}
            >
              <SelectTrigger
                className="w-[160px] rounded-lg sm:ml-auto sm:flex"
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
                amount: { label: "Expense Amount" },
                ...expensePieChartData.reduce((acc: any, item, index) => {
                  const colors = [
                    "#fca5a5",
                    "#f87171",
                    "#ef4444",
                    "#dc2626",
                    "#b91c1c",
                  ];
                  acc[item.category] = {
                    label: item.category?.replace("_", " ").toUpperCase(),
                    color: colors[index % colors.length],
                  };
                  return acc;
                }, {}),
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
                    const colors = [
                      "#fca5a5",
                      "#f87171",
                      "#ef4444",
                      "#dc2626",
                      "#b91c1c",
                    ];
                    return { ...item, fill: colors[index % colors.length] };
                  })}
                  dataKey="amount"
                  nameKey="category"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        const totalExpenses = expensePieChartData.reduce(
                          (acc, curr) => acc + curr.amount,
                          0
                        );
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
                      return null;
                    }}
                  />
                </Pie>
              </RechartsPieChart>
            </ChartContainer>
          </CardContent>

          <div className="flex-col gap-2 text-sm px-6 pb-6 text-center">
            <div className="flex items-center justify-center gap-2 leading-none font-medium">
              <TrendingDown className="h-4 w-4" />
              {expensePieChartData[0]?.category
                ?.replace("_", " ")
                .toUpperCase() ?? "—"}{" "}
              leading with{" "}
              {expensePieChartData[0]?.percentage?.toFixed(1) ?? "0.0"}%
            </div>
            <div className="text-muted-foreground leading-none">
              Showing distribution across {expensePieChartData.length} expense
              categories
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
