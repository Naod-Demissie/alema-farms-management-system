"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Egg, Target, AlertCircle, CheckCircle } from "lucide-react";
import { ProductionFilters, EGG_GRADES } from "./production-types";
import { getProductionSummary, getDailyProductionData } from "@/server/production";
import { toast } from "sonner";

interface Flock {
  id: string;
  batchCode: string;
  breed: string;
  currentCount: number;
}

interface ProductionAnalyticsProps {
  filters: ProductionFilters;
  flocks: Flock[];
}

export function ProductionAnalytics({
  filters,
  flocks
}: ProductionAnalyticsProps) {
  const [summary, setSummary] = useState<any>(null);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [summaryResult, dailyResult] = await Promise.all([
        getProductionSummary(filters.flockId, filters.dateRange),
        getDailyProductionData(filters.dateRange)
      ]);

      if (summaryResult.success) {
        setSummary(summaryResult.data);
      }

      if (dailyResult.success) {
        setDailyData(dailyResult.data);
      }
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

  const getGradeColor = (grade: string) => {
    const gradeInfo = EGG_GRADES.find(g => g.value === grade);
    return gradeInfo?.color || "bg-gray-100 text-gray-800";
  };

  const getQualityPercentage = () => {
    if (!summary) return 0;
    const total = summary.totalEggs;
    if (total === 0) return 0;
    
    const qualityEggs = summary.gradeBreakdown.normal;
    return Math.round((qualityEggs / total) * 100);
  };

  const getProductionTrend = () => {
    if (!summary || !summary.productionTrend) return [];
    return summary.productionTrend.slice(-7); // Last 7 days
  };

  const getTopPerformingFlock = () => {
    if (dailyData.length === 0) return null;
    
    const flockPerformance = dailyData.reduce((acc, day) => {
      if (!acc[day.flockId]) {
        acc[day.flockId] = {
          flockCode: day.flockCode,
          breed: day.breed,
          totalEggs: 0,
          qualityScore: 0,
          days: 0
        };
      }
      acc[day.flockId].totalEggs += day.totalEggs;
      acc[day.flockId].qualityScore += day.qualityScore;
      acc[day.flockId].days += 1;
      return acc;
    }, {} as any);

    const topFlock = Object.values(flockPerformance).reduce((max: any, current: any) => {
      const currentAvg = current.qualityScore / current.days;
      const maxAvg = max.qualityScore / max.days;
      return currentAvg > maxAvg ? current : max;
    });

    return {
      ...topFlock,
      averageQualityScore: Math.round((topFlock.qualityScore / topFlock.days) * 100) / 100
    };
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Production</CardTitle>
            <Egg className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.totalEggs?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              eggs collected
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
              {summary?.averageDailyProduction?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              eggs per day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getQualityPercentage()}%</div>
            <p className="text-xs text-muted-foreground">
              Normal quality eggs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Flocks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flocks.length}</div>
            <p className="text-xs text-muted-foreground">
              in production
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="grades" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grades">Grade Distribution</TabsTrigger>
          <TabsTrigger value="trends">Production Trends</TabsTrigger>
          <TabsTrigger value="flocks">Flock Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="grades" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Grade Breakdown</CardTitle>
                <CardDescription>
                  Distribution of eggs by quality grade
                </CardDescription>
              </CardHeader>
              <CardContent>
                {summary?.gradeBreakdown && (
                  <div className="space-y-4">
                    {Object.entries(summary.gradeBreakdown).map(([grade, count]) => {
                      const percentage = summary.totalEggs > 0 
                        ? Math.round((count as number / summary.totalEggs) * 100) 
                        : 0;
                      
                      return (
                        <div key={grade} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className={getGradeColor(grade)}>
                                Grade {grade.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-sm font-medium">
                              {count as number} ({percentage}%)
                            </div>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Production Trend (Last 7 Days)</CardTitle>
              <CardDescription>
                Daily production volume over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getProductionTrend().length > 0 ? (
                <div className="space-y-4">
                  {getProductionTrend().map((day, index) => (
                    <div key={day.date} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {new Date(day.date).toLocaleDateString()}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {day.total} eggs
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-medium text-green-600">{day.normal}</div>
                          <div className="text-muted-foreground">Normal</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-orange-600">{day.cracked}</div>
                          <div className="text-muted-foreground">Cracked</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-red-600">{day.spoiled}</div>
                          <div className="text-muted-foreground">Spoiled</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No production data available for the selected period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flocks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Flock Performance</CardTitle>
              <CardDescription>
                Performance metrics by flock
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dailyData.length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(
                    dailyData.reduce((acc, day) => {
                      if (!acc[day.flockId]) {
                        acc[day.flockId] = {
                          flockCode: day.flockCode,
                          breed: day.breed,
                          totalEggs: 0,
                          qualityScore: 0,
                          days: 0
                        };
                      }
                      acc[day.flockId].totalEggs += day.totalEggs;
                      acc[day.flockId].qualityScore += day.qualityScore;
                      acc[day.flockId].days += 1;
                      return acc;
                    }, {} as any)
                  ).map(([flockId, data]: [string, any]) => {
                    const avgQuality = data.days > 0 ? data.qualityScore / data.days : 0;
                    const avgDaily = data.days > 0 ? data.totalEggs / data.days : 0;
                    
                    return (
                      <div key={flockId} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{data.flockCode}</div>
                            <div className="text-sm text-muted-foreground">
                              {data.breed.replace('_', ' ')} • {data.days} days
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {Math.round(avgDaily)} eggs/day
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {Math.round(avgQuality)}% quality
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Progress value={avgQuality} className="h-2" />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round(avgQuality)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No flock performance data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
