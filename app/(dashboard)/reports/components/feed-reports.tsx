"use client";

import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wheat,
  TrendingUp,
  BarChart3,
  PieChart,
  Package,
  Target,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Label,
} from "recharts";
import { WeightFCRTrendCharts } from "@/app/(dashboard)/feed/components/weight-sampling/weight-fcr-trend-charts";
import { getFeedAnalyticsAction } from "@/app/(dashboard)/feed/server/feed";
import { getFeedConsumptionAnalyticsAction } from "@/app/(dashboard)/feed/server/feed-inventory";
import { getFeedEfficiencyStats } from "@/app/(dashboard)/feed/server/feed-analytics";
import { getInventoryWithUsageAction } from "@/app/(dashboard)/feed/server/feed-inventory";

interface ReportFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  flockId: string;
  reportType: string;
}

interface FeedReportsProps {
  filters: ReportFilters;
}

interface FeedData {
  totalFeedUsed: number;
  totalFeedCost: number;
  averageDailyConsumption: number;
  feedEfficiency: number;
  inventoryValue: number;
  lowStockItems: number;
  feedByType: Array<{
    type: string;
    quantity: number;
    cost: number;
    percentage: number;
  }>;
  feedBySupplier: Array<{
    supplier: string;
    quantity: number;
    cost: number;
    percentage: number;
  }>;
  flockFeedUsage: Array<{
    flockId: string;
    flockCode: string;
    breed: string;
    totalUsed: number;
    cost: number;
    efficiency: number;
  }>;
  dailyFlockUsage: Array<{
    date: string;
    [flockCode: string]: number | string;
  }>;
}

export function FeedReports({ filters }: FeedReportsProps) {
  const t = useTranslations('reports');
  const [data, setData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Time filter states for different charts
  const [feedUsageTimeFilter, setFeedUsageTimeFilter] = useState<string>("3months");
  const [feedTypeTimeFilter, setFeedTypeTimeFilter] = useState<string>("3months");
  const [supplierTimeFilter, setSupplierTimeFilter] = useState<string>("3months");

  // Helper: map time filter to date range
  const getDateRangeForFilter = (timeFilter: string) => {
    const now = new Date();
    let startDate: Date;

    switch (timeFilter) {
      case "7days":
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

  useEffect(() => {
    fetchFeedData();
  }, [filters]);

  const fetchFeedData = async () => {
    setLoading(true);
    try {
      // Fetch data from multiple sources in parallel
      const [feedAnalyticsResult, consumptionResult, efficiencyResult, inventoryResult] = await Promise.all([
        getFeedAnalyticsAction({
          startDate: filters.dateRange.start,
          endDate: filters.dateRange.end,
          flockId: filters.flockId !== "all" ? filters.flockId : undefined
        }),
        getFeedConsumptionAnalyticsAction({
          startDate: filters.dateRange.start,
          endDate: filters.dateRange.end,
          flockId: filters.flockId !== "all" ? filters.flockId : undefined
        }),
        getFeedEfficiencyStats(),
        getInventoryWithUsageAction()
      ]);

      // Process feed analytics data
      const feedAnalytics = feedAnalyticsResult.success ? feedAnalyticsResult.data : null;
      const consumption = consumptionResult.success ? consumptionResult.data : null;
      const efficiency = efficiencyResult.success ? efficiencyResult.data : null;
      const inventory = inventoryResult.success ? inventoryResult.data : null;

      // Calculate total feed used
      const totalFeedUsed = feedAnalytics?.totalUsage || 0;
      
      // Calculate average cost per kg from actual inventory data
      const averageCostPerKg = inventory && inventory.length > 0 
        ? inventory.reduce((sum, item) => sum + (item.costPerUnit || 0), 0) / inventory.length
        : 1.5; // Fallback if no inventory data
      const totalFeedCost = totalFeedUsed * averageCostPerKg;

      // Calculate average daily consumption
      const daysDiff = Math.ceil((filters.dateRange.end.getTime() - filters.dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
      const averageDailyConsumption = daysDiff > 0 ? totalFeedUsed / daysDiff : 0;

      // Get feed efficiency from efficiency stats
      const feedEfficiency = efficiency?.monthlyFCR ? (1 / efficiency.monthlyFCR) * 100 : 0;

      // Calculate inventory value
      const inventoryValue = inventory?.reduce((sum, item) => {
        // IMPORTANT: quantity is stored in KG, costPerUnit is per original unit
        // Need to convert costPerUnit to cost per KG if unit is QUINTAL
        let costPerKg = item.costPerUnit || averageCostPerKg;
        if (item.unit === 'QUINTAL' && item.costPerUnit) {
          costPerKg = item.costPerUnit / 100; // Convert quintal cost to per KG
        }
        return sum + (item.quantity * costPerKg);
      }, 0) || 0;

      // Count low stock items (items with less than 7 days remaining)
      const lowStockItems = inventory?.filter(item => 
        item.daysRemaining !== null && item.daysRemaining < 7
      ).length || 0;

      // Process feed by type data
      const feedByType = feedAnalytics?.feedTypeBreakdown?.map(item => {
        const totalQuantity = totalFeedUsed;
        const percentage = totalQuantity > 0 ? (item.totalUsage / totalQuantity) * 100 : 0;
        const cost = item.totalUsage * averageCostPerKg;
        
        return {
          type: item.feedType,
          quantity: item.totalUsage,
          cost: cost,
          percentage: percentage
        };
      }) || [];

      // Process feed by supplier data
      const feedBySupplier = inventory?.reduce((acc, item) => {
        if (item.supplier) {
          // IMPORTANT: quantity is stored in KG, costPerUnit is per original unit
          // Need to convert costPerUnit to cost per KG if unit is QUINTAL
          let costPerKg = item.costPerUnit || averageCostPerKg;
          if (item.unit === 'QUINTAL' && item.costPerUnit) {
            costPerKg = item.costPerUnit / 100; // Convert quintal cost to per KG
          }
          
          const existing = acc.find(s => s.supplier === item.supplier.name);
          if (existing) {
            existing.quantity += item.quantity;
            existing.cost += item.quantity * costPerKg;
          } else {
            acc.push({
              supplier: item.supplier.name,
              quantity: item.quantity,
              cost: item.quantity * costPerKg,
              percentage: 0 // Will be calculated below
            });
          }
        }
        return acc;
      }, [] as Array<{supplier: string, quantity: number, cost: number, percentage: number}>) || [];

      // Calculate supplier percentages
      const totalSupplierQuantity = feedBySupplier.reduce((sum, item) => sum + item.quantity, 0);
      feedBySupplier.forEach(item => {
        item.percentage = totalSupplierQuantity > 0 ? (item.quantity / totalSupplierQuantity) * 100 : 0;
      });

      // Process flock feed usage data
      const flockFeedUsage = feedAnalytics?.flockBreakdown?.map(item => {
        const cost = item.totalUsage * averageCostPerKg;
        // Calculate efficiency based on actual usage patterns
        // Higher efficiency = lower feed usage per bird (simplified calculation)
        const baseEfficiency = 80;
        const usageVariation = Math.min(20, Math.max(-20, (item.totalUsage - 1000) / 100));
        const efficiency = Math.max(60, Math.min(95, baseEfficiency - usageVariation));
        
        return {
          flockId: item.flockId,
          flockCode: item.batchCode || "Unknown",
          breed: item.breed || "Unknown",
          totalUsed: item.totalUsage,
          cost: cost,
          efficiency: Math.round(efficiency)
        };
      }) || [];

      // Generate daily flock usage data from consumption analytics
      const dailyFlockUsage: Array<{date: string, [key: string]: number | string}> = [];
      
      if (consumption?.analytics) {
        // Get all unique dates from consumption data
        const allDates = new Set<string>();
        consumption.analytics.forEach(analytics => {
          Object.keys(analytics.dailyUsage).forEach(date => allDates.add(date));
        });

        // Create daily usage records
        Array.from(allDates).sort().forEach(date => {
          const dailyRecord: {date: string, [key: string]: number | string} = { date };
          
          // Add usage for each flock
          flockFeedUsage.forEach(flock => {
            // Find usage for this flock on this date
            const flockUsage = consumption.analytics.find(analytics => 
              analytics.flocks.includes(flock.flockId)
            );
            
            if (flockUsage && flockUsage.dailyUsage[date]) {
              dailyRecord[flock.flockCode] = flockUsage.dailyUsage[date];
            } else {
              dailyRecord[flock.flockCode] = 0;
            }
          });
          
          dailyFlockUsage.push(dailyRecord);
        });
      }

      // Create the final data object
      const realData: FeedData = {
        totalFeedUsed,
        totalFeedCost,
        averageDailyConsumption,
        feedEfficiency,
        inventoryValue,
        lowStockItems,
        feedByType,
        feedBySupplier,
        flockFeedUsage,
        dailyFlockUsage
      };

      setData(realData);
    } catch (error) {
      console.error("Error fetching feed data:", error);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <p className="text-muted-foreground mt-4">Loading feed data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Feed Data Available</h3>
        <p className="text-muted-foreground">
          No feed data found for the selected time period. Try adjusting your filters or add some feed usage records.
        </p>
      </div>
    );
  }

  // Color palettes for charts
  const flockColors = ["#f97316", "#fb923c", "#fdba74", "#fed7aa"];
  const feedTypeColors = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0"];
  const supplierColors = ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];

  // Filter data based on time filters
  const getFilteredFlockUsageData = () => {
    const { startDate } = getDateRangeForFilter(feedUsageTimeFilter);
    return data.dailyFlockUsage.filter(item => new Date(item.date) >= startDate);
  };

  const getFilteredFeedTypeData = () => {
    return data.feedByType.filter(item => item.quantity > 0);
  };

  const getFilteredSupplierData = () => {
    return data.feedBySupplier.filter(item => item.quantity > 0);
  };

  const filteredFlockUsageData = getFilteredFlockUsageData();
  const filteredFeedTypeData = getFilteredFeedTypeData();
  const filteredSupplierData = getFilteredSupplierData();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('feed.totalFeedUsed')}</CardTitle>
            <Wheat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totalFeedUsed.toLocaleString()} kg
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              Total consumption
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('feed.totalFeedCost')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data.totalFeedCost.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              Total cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('feed.feedEfficiency')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.feedEfficiency.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              Feed efficiency
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Flocks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.flockFeedUsage.length}</div>
            <p className="text-xs text-muted-foreground">
              Consuming feed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weight and FCR Trends */}
      <WeightFCRTrendCharts />

      {/* Charts Row 1: Feed Usage by Flock */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="pt-0">
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle>Feed Usage by Flock</CardTitle>
              <CardDescription>Daily feed consumption across all flocks</CardDescription>
            </div>
            <Select value={feedUsageTimeFilter} onValueChange={setFeedUsageTimeFilter}>
              <SelectTrigger
                className="w-[160px] rounded-lg sm:ml-auto"
                aria-label={t('common.selectTimeRange')}
              >
                <SelectValue placeholder={t('common.last3Months')} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="3months" className="rounded-lg">{t('common.last3Months')}</SelectItem>
                <SelectItem value="month" className="rounded-lg">{t('common.last30Days')}</SelectItem>
                <SelectItem value="7days" className="rounded-lg">{t('common.last7Days')}</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="px-2 sm:p-6">
            <ChartContainer
              config={(() => {
                const cfg: any = {};
                if (data) {
                  data.flockFeedUsage.forEach((flock, idx) => {
                    cfg[flock.flockCode] = { 
                      label: flock.flockCode, 
                      color: flockColors[idx % flockColors.length] 
                    };
                  });
                }
                return cfg;
              })()}
              className="aspect-auto h-[300px] w-full"
            >
              <AreaChart data={filteredFlockUsageData}>
                <defs>
                  {data?.flockFeedUsage.map((flock, idx) => {
                    const color = flockColors[idx % flockColors.length];
                    return (
                      <linearGradient key={`fill${flock.flockCode}`} id={`fill${flock.flockCode}`} x1="0" y1="0" x2="0" y2="1">
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
                        `${Number(value).toLocaleString()} kg`,
                        name,
                      ]}
                      indicator="dot"
                    />
                  }
                />
                {data?.flockFeedUsage.map((flock, idx) => {
                  const color = flockColors[idx % flockColors.length];
                  return (
                    <Area
                      key={flock.flockCode}
                      dataKey={flock.flockCode}
                      type="linear"
                      fill={`url(#fill${flock.flockCode})`}
                      stroke={color}
                      stackId="a"
                    />
                  );
                })}
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feed by Type Pie Chart */}
        <Card>
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle>{t('feed.feedUsageByType')}</CardTitle>
              <CardDescription>{t('feed.feedUsageByTypeDesc')}</CardDescription>
            </div>
            <Select value={feedTypeTimeFilter} onValueChange={setFeedTypeTimeFilter}>
              <SelectTrigger
                className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
                aria-label={t('common.selectTimeRange')}
              >
                <SelectValue placeholder={t('common.last3Months')} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="3months" className="rounded-lg">{t('common.last3Months')}</SelectItem>
                <SelectItem value="month" className="rounded-lg">{t('common.last30Days')}</SelectItem>
                <SelectItem value="7days" className="rounded-lg">{t('common.last7Days')}</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                quantity: { label: "Quantity (kg)" },
                ...(data?.feedByType || []).reduce((acc: any, item, index) => {
                  acc[item.type] = { 
                    label: item.type.charAt(0).toUpperCase() + item.type.slice(1), 
                    color: feedTypeColors[index % feedTypeColors.length] 
                  };
                  return acc;
                }, {} as any),
              }}
              className="mx-auto aspect-square max-h-[250px]"
            >
              <RechartsPieChart>
                <Pie
                  data={filteredFeedTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="quantity"
                >
                  {filteredFeedTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={feedTypeColors[index % feedTypeColors.length]} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        const total = filteredFeedTypeData.reduce((acc, curr) => acc + curr.quantity, 0);
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
                              kg
                            </tspan>
                          </text>
                        );
                      }
                      return null;
                    }}
                  />
                </Pie>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              </RechartsPieChart>
            </ChartContainer>
            <div className="flex flex-col items-center gap-2 text-sm px-2 pt-4">
              {(() => {
                const sorted = [...filteredFeedTypeData].sort((a, b) => b.quantity - a.quantity);
                const leader = sorted[0];
                const total = filteredFeedTypeData.reduce((acc, it) => acc + it.quantity, 0);
                const percentage = total > 0 && leader?.quantity ? (leader.quantity / total) * 100 : 0;
                return (
                  <div className="flex items-center gap-2 leading-none font-medium">
                    <TrendingUp className="h-4 w-4" />
                    {leader?.type.charAt(0).toUpperCase() + leader?.type.slice(1)} leading with {percentage.toFixed(1)}%
                  </div>
                );
              })()}
              <div className="text-muted-foreground leading-none text-center">
                Showing distribution across {filteredFeedTypeData.length} feed types
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supplier Analysis Pie Chart */}
        <Card>
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle>{t('feed.feedUsageBySupplier')}</CardTitle>
              <CardDescription>{t('feed.feedUsageBySupplierDesc')}</CardDescription>
            </div>
            <Select value={supplierTimeFilter} onValueChange={setSupplierTimeFilter}>
              <SelectTrigger
                className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
                aria-label={t('common.selectTimeRange')}
              >
                <SelectValue placeholder={t('common.last3Months')} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="3months" className="rounded-lg">{t('common.last3Months')}</SelectItem>
                <SelectItem value="month" className="rounded-lg">{t('common.last30Days')}</SelectItem>
                <SelectItem value="7days" className="rounded-lg">{t('common.last7Days')}</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                quantity: { label: "Quantity (kg)" },
                ...(data?.feedBySupplier || []).reduce((acc: any, item, index) => {
                  acc[item.supplier] = { 
                    label: item.supplier, 
                    color: supplierColors[index % supplierColors.length] 
                  };
                  return acc;
                }, {} as any),
              }}
              className="mx-auto aspect-square max-h-[250px]"
            >
              <RechartsPieChart>
                <Pie
                  data={filteredSupplierData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="quantity"
                >
                  {filteredSupplierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={supplierColors[index % supplierColors.length]} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        const total = filteredSupplierData.reduce((acc, curr) => acc + curr.quantity, 0);
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
                              kg
                            </tspan>
                          </text>
                        );
                      }
                      return null;
                    }}
                  />
                </Pie>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              </RechartsPieChart>
            </ChartContainer>
            <div className="flex flex-col items-center gap-2 text-sm px-2 pt-4">
              {(() => {
                const sorted = [...filteredSupplierData].sort((a, b) => b.quantity - a.quantity);
                const leader = sorted[0];
                const total = filteredSupplierData.reduce((acc, it) => acc + it.quantity, 0);
                const percentage = total > 0 && leader?.quantity ? (leader.quantity / total) * 100 : 0;
                return (
                  <div className="flex items-center gap-2 leading-none font-medium">
                    <TrendingUp className="h-4 w-4" />
                    {leader?.supplier} leading with {percentage.toFixed(1)}%
                  </div>
                );
              })()}
              <div className="text-muted-foreground leading-none text-center">
                Showing distribution across {filteredSupplierData.length} suppliers
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}