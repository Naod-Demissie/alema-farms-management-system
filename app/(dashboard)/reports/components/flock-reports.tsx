                    "use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bird, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Activity,
  Users,
  Calendar
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Area, AreaChart, Pie, PieChart, XAxis, YAxis, CartesianGrid, Label } from "recharts";
import { getFlocks } from "@/app/(dashboard)/flocks/server/flocks";
import { Flock } from "../../flocks/components/flock-types";

interface FlockData {
  totalFlocks: number;
  totalBirds: number;
  averageMortalityRate: number;
  flocksByBreed: Array<{
    breed: string;
    count: number;
    birds: number;
    percentage: number;
  }>;
  birdsPerFlockTrend: Array<{
    date: string;
    [key: string]: string | number; // Dynamic flock data
  }>;
  healthStatus: Array<{
    status: string;
    count: number;
    color: string;
  }>;
}

interface FlockReportsProps {
  filters: {
    dateRange: {
      startDate: Date;
      endDate: Date;
    };
    flockId: string;
    reportType: string;
  };
}

// Helper function to process real flock data
const processFlockData = (flocks: Flock[]): FlockData => {
  const totalFlocks = flocks.length;
  const totalBirds = flocks.reduce((sum, flock) => sum + flock.currentCount, 0);
  
  // Calculate average mortality rate
  const totalInitialBirds = flocks.reduce((sum, flock) => sum + flock.initialCount, 0);
  const totalMortality = totalInitialBirds - totalBirds;
  const averageMortalityRate = totalInitialBirds > 0 ? (totalMortality / totalInitialBirds) * 100 : 0;

  // Group by breed
  const breedGroups = flocks.reduce((acc, flock) => {
    const breed = flock.breed;
    if (!acc[breed]) {
      acc[breed] = { count: 0, birds: 0 };
    }
    acc[breed].count++;
    acc[breed].birds += flock.currentCount;
    return acc;
  }, {} as Record<string, { count: number; birds: number }>);

  const flocksByBreed = Object.entries(breedGroups).map(([breed, data]: [string, { count: number; birds: number }]) => ({
    breed: breed.charAt(0).toUpperCase() + breed.slice(1).replace('_', ' '),
    count: data.count,
    birds: data.birds,
    percentage: totalBirds > 0 ? (data.birds / totalBirds) * 100 : 0
  }));


  // Generate birds per flock trend data (simulated daily data for last 30 days)
  const birdsPerFlockTrend = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayData: { date: string; [key: string]: string | number } = { date: dateStr };
    
    flocks.forEach((flock, index) => {
      // Simulate daily mortality (1-3% per day)
      const dailyMortalityRate = 0.01 + (Math.random() * 0.02);
      const currentBirds = i === 29 ? flock.currentCount : 
        Math.max(0, Math.floor((dayData[`flock_${index}`] as number || flock.currentCount) * (1 - dailyMortalityRate)));
      
      dayData[`flock_${index}`] = currentBirds;
    });
    
    birdsPerFlockTrend.push(dayData);
  }


  // Health status based on mortality rate
  const healthStatus = flocks.reduce((acc, flock) => {
    const mortalityRate = ((flock.initialCount - flock.currentCount) / flock.initialCount) * 100;
    let status = "Healthy";
    if (mortalityRate > 15) status = "Critical";
    else if (mortalityRate > 5) status = "At Risk";
    
    const existing = acc.find((item: { status: string; count: number; color: string }) => item.status === status);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ 
        status, 
        count: 1, 
        color: status === "Healthy" ? "#10b981" : status === "At Risk" ? "#f59e0b" : "#ef4444" 
      });
    }
    return acc;
  }, [] as Array<{ status: string; count: number; color: string }>);

  return {
    totalFlocks,
    totalBirds,
    averageMortalityRate,
    flocksByBreed,
    birdsPerFlockTrend,
    healthStatus
  };
};


const COLORS = {
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4"
};

export function FlockReports({ filters }: FlockReportsProps) {
  const [data, setData] = useState<FlockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("90d");
  const [flocks, setFlocks] = useState<Flock[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getFlocks({}, { page: 1, limit: 100 }, { field: 'createdAt', direction: 'desc' });
        
        if (result.success && result.data) {
          setFlocks(result.data);
          const processedData = processFlockData(result.data);
          setData(processedData);
        }
      } catch (error) {
        console.error('Error fetching flock data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  // Filter data based on time range
  const filteredPopulationData = data?.birdsPerFlockTrend?.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date();
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  }) || [];


  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flocks</CardTitle>
            <Bird className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading || !data ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{data.totalFlocks}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  +12% from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Birds</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading || !data ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{data.totalBirds.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  +8% from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mortality Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading || !data ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{data.averageMortalityRate.toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingDown className="inline h-3 w-3 mr-1" />
                  -0.3% from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy Flocks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading || !data ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {data.healthStatus.find(h => h.status === "Healthy")?.count || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(((data.healthStatus.find(h => h.status === "Healthy")?.count || 0) / data.totalFlocks) * 100)}% of total
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Birds per Flock Trend - Interactive Area Chart */}
        <Card className="pt-0">
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle>Birds per Flock Trend</CardTitle>
              <CardDescription>
                Showing average birds per flock over time with mortality impact
              </CardDescription>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger
                className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
                aria-label="Select a time range"
              >
                <SelectValue placeholder="Last 3 months" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="90d" className="rounded-lg">
                  Last 3 months
                </SelectItem>
                <SelectItem value="30d" className="rounded-lg">
                  Last 30 days
                </SelectItem>
                <SelectItem value="7d" className="rounded-lg">
                  Last 7 days
                </SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            {loading || !data ? (
              <div className="flex items-center justify-center h-[250px]">
              </div>
            ) : (
              <ChartContainer
                config={(() => {
                  const config: any = {
                    birdsPerFlock: {
                      label: "Birds per Flock",
                    },
                  };
                  
                  // Add each flock to the config
                  flocks.forEach((flock, index) => {
                    const colors = [
                      "rgb(249, 115, 22)",
                      "rgb(124, 45, 18)", 
                      "rgb(194, 65, 12)",
                      "rgb(59, 130, 246)",
                      "rgb(16, 185, 129)",
                      "rgb(245, 158, 11)",
                      "rgb(239, 68, 68)",
                      "rgb(139, 92, 246)"
                    ];
                    config[`flock_${index}`] = {
                      label: flock.batchCode,
                      color: colors[index % colors.length],
                    };
                  });
                  
                  return config;
                })()}
                className="aspect-auto h-[250px] w-full"
              >
                <AreaChart data={filteredPopulationData}>
                  <defs>
                    {flocks.map((flock, index) => {
                      const colors = [
                        "rgb(249, 115, 22)",
                        "rgb(124, 45, 18)", 
                        "rgb(194, 65, 12)",
                        "rgb(59, 130, 246)",
                        "rgb(16, 185, 129)",
                        "rgb(245, 158, 11)",
                        "rgb(239, 68, 68)",
                        "rgb(139, 92, 246)"
                      ];
                      const color = colors[index % colors.length];
                      return (
                        <linearGradient key={`fillFlock_${index}`} id={`fillFlock_${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={color}
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor={color}
                            stopOpacity={0.1}
                          />
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
                      const date = new Date(value)
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => {
                          return new Date(value).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        }}
                        indicator="dot"
                      />
                    }
                  />
                  {flocks.map((flock, index) => {
                    const colors = [
                      "rgb(249, 115, 22)",
                      "rgb(124, 45, 18)", 
                      "rgb(194, 65, 12)",
                      "rgb(59, 130, 246)",
                      "rgb(16, 185, 129)",
                      "rgb(245, 158, 11)",
                      "rgb(239, 68, 68)",
                      "rgb(139, 92, 246)"
                    ];
                    const color = colors[index % colors.length];
                    return (
                      <Area
                        key={`flock_${index}`}
                        dataKey={`flock_${index}`}
                        type="linear"
                        fill={`url(#fillFlock_${index})`}
                        stroke={color}
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

        {/* Breed Distribution - Donut Pie Chart */}
        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle>Breed Distribution</CardTitle>
            <CardDescription>Flocks by breed type</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            {loading || !data ? (
              <div className="flex items-center justify-center h-[250px]">
              </div>
            ) : (
              <ChartContainer
                config={{
                  count: {
                    label: "Flock Count",
                  },
                  broiler: {
                    label: "Broiler",
                    color: "rgb(249, 115, 22)",
                  },
                  layer: {
                    label: "Layer", 
                    color: "rgb(124, 45, 18)",
                  },
                  dual_purpose: {
                    label: "Dual Purpose",
                    color: "rgb(194, 65, 12)",
                  },
                }}
                className="mx-auto aspect-square max-h-[250px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={data.flocksByBreed.map((breed, index) => {
                      const colors = [
                        "rgb(67, 20, 7)",      // Broiler - Dark brown
                        "rgb(124, 45, 18)",    // Layer - Medium brown
                        "rgb(194, 65, 12)"     // Dual Purpose - Light brown
                      ];
                      return {
                        ...breed,
                        fill: colors[index]
                      };
                    })}
                    dataKey="count"
                    nameKey="breed"
                    innerRadius={60}
                    strokeWidth={5}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          const totalFlocks = data.flocksByBreed.reduce((acc, curr) => acc + curr.count, 0);
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
                                {totalFlocks}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="fill-muted-foreground"
                              >
                                Flocks
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-2 text-sm">
            {loading || !data ? (
              <div className="text-muted-foreground"></div>
            ) : (
              <>
                <div className="flex items-center gap-2 leading-none font-medium">
                  <TrendingUp className="h-4 w-4" />
                  Broiler flocks leading with {data.flocksByBreed[0]?.percentage}%
                </div>
                <div className="text-muted-foreground leading-none text-center">
                  Showing distribution across {data.flocksByBreed.length} breed types
                </div>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
