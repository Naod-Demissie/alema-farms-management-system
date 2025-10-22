"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getWeightSamplingWithFCR } from "../../server/weight-sampling";
import { getFeedConversionRatio, getFeedEfficiencyStats } from "../../server/feed-analytics";
import { Scale, TrendingUp, Activity } from "lucide-react";
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
  LineChart,
  Line,
} from "recharts";

interface WeightFCRTrendChartsProps {
  timeFilter?: string;
  onTimeFilterChange?: (filter: string) => void;
}

interface WeightData {
  date: string;
  averageWeight: number;
  sampleSize: number;
  totalWeight: number;
  flockId: string;
  flockBatchCode: string;
}

interface FCRData {
  date: string;
  fcr: number;
  feedUsed: number;
  weightGain: number;
}

export function WeightFCRTrendCharts({ 
  timeFilter = "3months", 
  onTimeFilterChange 
}: WeightFCRTrendChartsProps) {
  const [weightData, setWeightData] = useState<WeightData[]>([]);
  const [fcrData, setFcrData] = useState<FCRData[]>([]);
  const [loading, setLoading] = useState(true);

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
    fetchData();
  }, [timeFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch weight sampling data for all flocks
      const weightResult = await getWeightSamplingWithFCR();
      if (weightResult.success && weightResult.data) {
        const { startDate } = getDateRangeForFilter(timeFilter);
        const filteredWeightData = weightResult.data
          .filter(record => new Date(record.date) >= startDate)
          .map(record => ({
            date: record.date.toISOString().split('T')[0],
            averageWeight: record.averageWeight,
            sampleSize: record.sampleSize,
            totalWeight: record.totalWeight,
            flockId: record.flockId,
            flockBatchCode: record.flock.batchCode,
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setWeightData(filteredWeightData);
      }

      // Fetch FCR data (mock for now - you can implement actual FCR trend data)
      const fcrResult = await getFeedConversionRatio();
      if (fcrResult.success && fcrResult.data) {
        // Create mock FCR trend data based on freshly filtered weight data
        const mockFcrData = (weightResult.success && weightResult.data)
          ? weightData.length > 0
            ? weightData
            : []
          : [];
        const mapped = mockFcrData.map((weight) => ({
          date: weight.date,
          fcr: 1.5 + (Math.random() * 0.8), // Mock FCR between 1.5-2.3
          feedUsed: weight.totalWeight * (1.5 + Math.random() * 0.8),
          weightGain: weight.totalWeight * 0.1, // Mock weight gain
        }));
        setFcrData(mapped);
      }
    } catch (error) {
      console.error("Error fetching trend data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeFilterChange = (newFilter: string) => {
    if (onTimeFilterChange) {
      onTimeFilterChange(newFilter);
    }
  };

  // Weight Trend Chart Component
  const WeightTrendChart = () => {
    // Group data by date and create chart data with per-flock average weights
    const createChartData = () => {
      const dateMap = new Map<string, any>();
      const flockColors = ["#16a34a", "#dc2626", "#2563eb", "#7c3aed", "#ea580c", "#0891b2"];
      
      // Get unique flocks
      const uniqueFlocks = [...new Set(weightData.map(d => d.flockBatchCode))];
      
      // Process each weight record
      weightData.forEach(record => {
        const dateKey = record.date;
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, { date: dateKey });
        }
        dateMap.get(dateKey)[record.flockBatchCode] = record.averageWeight;
      });
      
      // Convert to array and sort by date
      const chartData = Array.from(dateMap.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      return { chartData, uniqueFlocks, flockColors };
    };

    const { chartData, uniqueFlocks, flockColors } = createChartData();

    // Create chart config for each flock
    const chartConfig = uniqueFlocks.reduce((config, flock, index) => {
      config[flock] = {
        label: `${flock} (kg)`,
        color: flockColors[index % flockColors.length]
      };
      return config;
    }, {} as any);

    return (
      <Card className="pt-0">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Weight Trend by Flock
            </CardTitle>
            <CardDescription>Average weight progression per flock over time</CardDescription>
          </div>
          <Select value={timeFilter} onValueChange={handleTimeFilterChange}>
            <SelectTrigger
              className="w-[160px] rounded-lg sm:ml-auto"
              aria-label="Select time range"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="3months" className="rounded-lg">Last 3 months</SelectItem>
              <SelectItem value="month" className="rounded-lg">Last 30 days</SelectItem>
              <SelectItem value="7days" className="rounded-lg">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Weight Data</h3>
                <p className="text-muted-foreground">
                  No weight sampling data available for the selected time period.
                </p>
              </div>
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[300px] w-full"
            >
              <AreaChart data={chartData}>
                <defs>
                  {uniqueFlocks.map((flock, index) => {
                    const color = flockColors[index % flockColors.length];
                    return (
                      <linearGradient key={`fill${flock}`} id={`fill${flock}`} x1="0" y1="0" x2="0" y2="1">
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
                        `${Number(value).toFixed(2)} kg`,
                        name,
                      ]}
                      indicator="dot"
                    />
                  }
                />
                {uniqueFlocks.map((flock, index) => {
                  const color = flockColors[index % flockColors.length];
                  return (
                    <Area
                      key={flock}
                      dataKey={flock}
                      type="linear"
                      fill={`url(#fill${flock})`}
                      stroke={color}
                      strokeWidth={2}
                      stackId="a"
                    />
                  );
                })}
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    );
  };

  // FCR Trend Chart Component
  const FCRTrendChart = () => (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            FCR Trend
          </CardTitle>
          <CardDescription>Feed conversion ratio over time</CardDescription>
        </div>
        <Select value={timeFilter} onValueChange={handleTimeFilterChange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select time range"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="3months" className="rounded-lg">Last 3 months</SelectItem>
            <SelectItem value="month" className="rounded-lg">Last 30 days</SelectItem>
            <SelectItem value="7days" className="rounded-lg">Last 7 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={{
            fcr: { label: "FCR", color: "#dc2626" },
            feedUsed: { label: "Feed Used (kg)", color: "#f97316" },
            weightGain: { label: "Weight Gain (kg)", color: "#16a34a" },
          }}
          className="aspect-auto h-[300px] w-full"
        >
          <LineChart data={fcrData}>
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
                  formatter={(value, name) => {
                    if (name === "fcr") {
                      return [`${Number(value).toFixed(2)}`, name];
                    }
                    return [`${Number(value).toFixed(1)} kg`, name];
                  }}
                  indicator="dot"
                />
              }
            />
            <Line
              dataKey="fcr"
              type="monotone"
              stroke="#dc2626"
              strokeWidth={2}
              dot={{ fill: "#dc2626", strokeWidth: 2, r: 4 }}
            />
            <Line
              dataKey="feedUsed"
              type="monotone"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ fill: "#f97316", strokeWidth: 2, r: 4 }}
            />
            <Line
              dataKey="weightGain"
              type="monotone"
              stroke="#16a34a"
              strokeWidth={2}
              dot={{ fill: "#16a34a", strokeWidth: 2, r: 4 }}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading trend data...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <WeightTrendChart />
      <FCRTrendChart />
    </div>
  );
}
