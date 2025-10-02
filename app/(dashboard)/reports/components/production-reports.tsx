"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp } from "lucide-react";                                   
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { PieChart, Pie, Cell, Label } from "recharts";
import { ProductionFilters } from "../../production/components/production-types";
import {
  getProductionSummary,
  getDailyProductionData,
  DailyProductionData,
} from "@/server/production";
import { toast } from "sonner";

interface ProductionAnalyticsProps {
  filters: ProductionFilters;
}

export function ProductionReports({
  filters,
}: ProductionAnalyticsProps) {
  interface ProductionSummary {
    totalEggs: number;
    averageDailyProduction: number;
    gradeBreakdown: {
      normal: number;
      cracked: number;
      spoiled: number;
      [key: string]: number;
    };
    productionTrend: Array<{
      date: string;
      total: number;
      normal: number;
      cracked: number;
      spoiled: number;
    }>;
  }


  const [summary, setSummary] = useState<ProductionSummary | null>(null);
  const [dailyData, setDailyData] = useState<DailyProductionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendTimeFilter, setTrendTimeFilter] = useState<string>("90d");
  const [qualityTimeFilter, setQualityTimeFilter] = useState<string>("90d");

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [summaryResult, dailyResult] = await Promise.all([
        getProductionSummary(filters.flockId, filters.dateRange),
        getDailyProductionData(filters.dateRange),
      ]);

      setSummary(summaryResult && summaryResult.success && summaryResult.data ? (summaryResult.data as unknown as ProductionSummary) : null);
      setDailyData(dailyResult && dailyResult.success && dailyResult.data ? dailyResult.data : []);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load production analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

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

  // (helpers removed as not needed in simplified UI)

  // (removed unused flock performance helpers)

  interface TrendData {
    week: any[];
    month: any[];
    quarter: any[];
  }

  // Process egg production data for charts
  const processEggData = () => {
    if (!summary)
      return {
        trendData: { week: [], month: [], quarter: [] },
        qualityData: [],
      };

    // Use production trend data for charts
    const productionTrend = summary.productionTrend || [];

    // Generate trend data for different time periods
    const trendData: TrendData = {
      week: productionTrend.slice(-7),
      month: productionTrend.slice(-30),
      quarter: productionTrend.slice(-90),
    };

    // Prepare quality breakdown data
    const qualityData = [
      { name: "Good", value: summary.gradeBreakdown.normal, color: "#10b981" },
      {
        name: "Cracked",
        value: summary.gradeBreakdown.cracked,
        color: "#f59e0b",
      },
      {
        name: "Spoiled",
        value: summary.gradeBreakdown.spoiled,
        color: "#ef4444",
      },
    ];

    return { trendData, qualityData };
  };

  const { trendData, qualityData } = processEggData();
  const hasData = summary && summary.totalEggs > 0;

  // Build per-flock series from dailyData
  const uniqueFlocks = (() => {
    const map = new Map<string, { id: string; label: string }>();
    dailyData.forEach((d) => {
      if (!map.has(d.flockId)) {
        map.set(d.flockId, { id: d.flockId, label: d.flockCode });
      }
    });
    return Array.from(map.values());
  })();

  const perFlockSeries = (() => {
    const byDate: Record<string, any> = {};
    dailyData.forEach((d) => {
      if (!byDate[d.date]) byDate[d.date] = { date: d.date };
      const flockIndex = uniqueFlocks.findIndex((f) => f.id === d.flockId);
      if (flockIndex >= 0) {
        const key = `flock_${flockIndex}`;
        byDate[d.date][key] = (byDate[d.date][key] || 0) + (d.totalEggs || 0);
      }
    });
    const arr = Object.values(byDate).sort((a: any, b: any) => a.date.localeCompare(b.date));
    // Filter by trendTimeFilter
    const referenceDate = new Date();
    let days = 90;
    if (trendTimeFilter === "30d") days = 30;
    if (trendTimeFilter === "7d") days = 7;
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - days);
    return arr.filter((item: any) => new Date(item.date) >= startDate);
  })();

  // Filter quality data by selected range using summary.productionTrend
  const filteredQualityData = (() => {
    if (!summary) return [] as { name: string; value: number }[];
    const referenceDate = new Date();
    let days = 90;
    if (qualityTimeFilter === "30d") days = 30;
    if (qualityTimeFilter === "7d") days = 7;
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - days);
    const filtered = (summary.productionTrend || []).filter((d) => new Date(d.date) >= startDate);
    const totals = filtered.reduce(
      (acc, cur) => {
        acc.normal += cur.normal || 0;
        acc.cracked += cur.cracked || 0;
        acc.spoiled += cur.spoiled || 0;
        return acc;
      },
      { normal: 0, cracked: 0, spoiled: 0 }
    );
    
    // If no trend data, use the grade breakdown directly
    if (filtered.length === 0 && summary.gradeBreakdown) {
      return [
        { name: "Good", value: summary.gradeBreakdown.normal || 0 },
        { name: "Cracked", value: summary.gradeBreakdown.cracked || 0 },
        { name: "Spoiled", value: summary.gradeBreakdown.spoiled || 0 },
      ].filter(item => item.value > 0);
    }
    
    return [
      { name: "Good", value: totals.normal },
      { name: "Cracked", value: totals.cracked },
      { name: "Spoiled", value: totals.spoiled },
    ].filter(item => item.value > 0);
  })();

  // Orange color palette
  const orangeColors = [
    "#fed7aa",
    "#fdba74",
    "#fb923c",
    "#f97316",
    "#ea580c",
    "#c2410c",
    "#9a3412",
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Eggs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.totalEggs?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All time production
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.averageDailyProduction?.toFixed(1) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Eggs per day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                if (!summary?.gradeBreakdown) return "0%";
                const total = summary.gradeBreakdown.normal + summary.gradeBreakdown.cracked + summary.gradeBreakdown.spoiled;
                const quality = total > 0 ? (summary.gradeBreakdown.normal / total) * 100 : 0;
                return `${quality.toFixed(1)}%`;
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              Good quality eggs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Flocks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {uniqueFlocks.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Producing flocks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Egg Production Trend Area Chart */}
        <Card>
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle>Egg Production Trend</CardTitle>
              <CardDescription>7, 30, and 90 day trends</CardDescription>
            </div>
            <Select value={trendTimeFilter} onValueChange={setTrendTimeFilter}>
              <SelectTrigger
                className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
                aria-label="Select a time range"
              >
                <SelectValue placeholder="Last 3 months" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="90d" className="rounded-lg">Last 3 months</SelectItem>
                <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
                <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {perFlockSeries.length > 0 ? (
              <div className="space-y-4">
                <ChartContainer
                  config={(() => {
                    const cfg: any = {};
                    uniqueFlocks.forEach((f, idx) => {
                      const color = orangeColors[idx % orangeColors.length];
                      cfg[`flock_${idx}`] = { label: f.label, color };
                    });
                    return cfg;
                  })()}
                  className="aspect-auto h-[250px] w-full"
                >
                  <AreaChart data={perFlockSeries}>
                    <defs>
                      {uniqueFlocks.map((f, idx) => {
                        const color = orangeColors[idx % orangeColors.length];
                        return (
                          <linearGradient key={`fillFlock_${idx}`} id={`fillFlock_${idx}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                          </linearGradient>
                        );
                      })}
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={32}
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      }
                    />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                    {uniqueFlocks.map((f, idx) => {
                      const color = orangeColors[idx % orangeColors.length];
                      return (
                        <Area
                          key={`flock_${idx}`}
                          dataKey={`flock_${idx}`}
                          type="linear"
                          fill={`url(#fillFlock_${idx})`}
                          stroke={color}
                        />
                      );
                    })}
                  </AreaChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No production trend data available
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Egg Quality Pie Chart */}
        <Card>
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle>Egg Quality Breakdown</CardTitle>
              <CardDescription>Good vs cracked vs spoiled</CardDescription>
            </div>
            <Select value={qualityTimeFilter} onValueChange={setQualityTimeFilter}>
              <SelectTrigger
                className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
                aria-label="Select a time range"
              >
                <SelectValue placeholder="Last 3 months" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="90d" className="rounded-lg">Last 3 months</SelectItem>
                <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
                <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {filteredQualityData.length > 0 && filteredQualityData.some(item => item.value > 0) ? (
              <div className="h-[300px]">
                <ChartContainer
                  config={{
                    value: { label: "Eggs" },
                    ...filteredQualityData.reduce((acc: any, item, index) => {
                      acc[item.name] = { label: item.name, color: orangeColors[index % orangeColors.length] };
                      return acc;
                    }, {} as any),
                  }}
                  className="mx-auto aspect-square max-h-[250px]"
                >
                  <PieChart>
                    <Pie
                      data={filteredQualityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {filteredQualityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={orangeColors[index % orangeColors.length]} />
                      ))}
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            const total = summary?.totalEggs || 0;
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
                                  {total.toLocaleString()}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 24}
                                  className="fill-muted-foreground"
                                >
                                  eggs
                                </tspan>
                              </text>
                            );
                          }
                          return null;
                        }}
                      />
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  </PieChart>
                </ChartContainer>
                <div className="flex flex-col items-center gap-2 text-sm px-2 pt-4">
                  {(() => {
                    const sorted = [...filteredQualityData].sort((a, b) => b.value - a.value);
                    const leader = sorted[0];
                    const total = filteredQualityData.reduce((acc, it) => acc + it.value, 0);
                    const percentage = total > 0 && leader?.value ? (leader.value / total) * 100 : 0;
                    return (
                      <div className="flex items-center gap-2 leading-none font-medium">
                        <TrendingUp className="h-4 w-4" />
                        {leader?.name} leading with {percentage.toFixed(1)}%
                      </div>
                    );
                  })()}
                  <div className="text-muted-foreground leading-none text-center">
                    Showing distribution across {filteredQualityData.length} categories
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No quality data available
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
