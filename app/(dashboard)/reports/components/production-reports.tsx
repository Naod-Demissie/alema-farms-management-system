"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Egg, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Calendar,
  Target,
  CheckCircle,
  AlertCircle,
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

interface ProductionReportsProps {
  filters: ReportFilters;
}

interface ProductionData {
  totalEggs: number;
  averageDailyProduction: number;
  qualityScore: number;
  gradeBreakdown: {
    normal: number;
    cracked: number;
    spoiled: number;
  };
  dailyProduction: Array<{
    date: string;
    total: number;
    normal: number;
    cracked: number;
    spoiled: number;
  }>;
  flockProduction: Array<{
    flockId: string;
    flockCode: string;
    breed: string;
    totalEggs: number;
    qualityScore: number;
    dailyAverage: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    totalEggs: number;
    qualityScore: number;
    dailyAverage: number;
  }>;
  productionEfficiency: {
    eggsPerBird: number;
    productionRate: number;
    qualityRate: number;
  };
}

export function ProductionReports({ filters }: ProductionReportsProps) {
  const [data, setData] = useState<ProductionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchProductionData();
  }, [filters]);

  const fetchProductionData = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockData: ProductionData = {
        totalEggs: 45600,
        averageDailyProduction: 1520,
        qualityScore: 87.5,
        gradeBreakdown: {
          normal: 25000,
          cracked: 15000,
          spoiled: 4000
        },
        dailyProduction: [
          { date: "2024-01-01", total: 1500, normal: 1350, cracked: 100, spoiled: 50 },
          { date: "2024-01-02", total: 1520, normal: 1380, cracked: 90, spoiled: 50 },
          { date: "2024-01-03", total: 1480, normal: 1340, cracked: 95, spoiled: 45 },
          { date: "2024-01-04", total: 1560, normal: 1430, cracked: 85, spoiled: 45 },
          { date: "2024-01-05", total: 1540, normal: 1390, cracked: 100, spoiled: 50 },
          { date: "2024-01-06", total: 1510, normal: 1350, cracked: 110, spoiled: 50 },
          { date: "2024-01-07", total: 1530, normal: 1390, cracked: 95, spoiled: 45 }
        ],
        flockProduction: [
          { flockId: "1", flockCode: "A-001", breed: "layer", totalEggs: 18000, qualityScore: 92, dailyAverage: 600 },
          { flockId: "2", flockCode: "B-002", breed: "layer", totalEggs: 15600, qualityScore: 85, dailyAverage: 520 },
          { flockId: "3", flockCode: "C-003", breed: "dual_purpose", totalEggs: 12000, qualityScore: 78, dailyAverage: 400 }
        ],
        monthlyTrends: [
          { month: "Jan", totalEggs: 45600, qualityScore: 87.5, dailyAverage: 1520 },
          { month: "Feb", totalEggs: 42000, qualityScore: 85.2, dailyAverage: 1400 },
          { month: "Mar", totalEggs: 48000, qualityScore: 89.1, dailyAverage: 1600 },
          { month: "Apr", totalEggs: 46500, qualityScore: 88.3, dailyAverage: 1550 },
          { month: "May", totalEggs: 49200, qualityScore: 90.5, dailyAverage: 1640 },
          { month: "Jun", totalEggs: 46800, qualityScore: 87.8, dailyAverage: 1560 }
        ],
        productionEfficiency: {
          eggsPerBird: 19.0,
          productionRate: 85.2,
          qualityRate: 87.5
        }
      };
      
      setData(mockData);
    } catch (error) {
      console.error("Error fetching production data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    console.log(`Exporting production report as ${format}`);
    // Implement export logic
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'normal': return 'bg-green-500';
      case 'cracked': return 'bg-orange-500';
      case 'spoiled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getGradeLabel = (grade: string) => {
    switch (grade) {
      case 'normal': return 'Normal';
      case 'cracked': return 'Cracked';
      case 'spoiled': return 'Spoiled';
      default: return grade;
    }
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
        <p className="text-muted-foreground">No production data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Production</CardTitle>
            <Egg className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totalEggs.toLocaleString()}
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
              {data.averageDailyProduction.toLocaleString()}
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
            <div className="text-2xl font-bold">{data.qualityScore}%</div>
            <p className="text-xs text-muted-foreground">
              Normal quality eggs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.productionEfficiency.productionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Overall efficiency
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quality">Quality Analysis</TabsTrigger>
            <TabsTrigger value="daily">Daily Production</TabsTrigger>
            <TabsTrigger value="flocks">Flock Performance</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
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
                  Grade Distribution
                </CardTitle>
                <CardDescription>Distribution of eggs by quality grade</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(data.gradeBreakdown).map(([grade, count]) => {
                    const percentage = (count / data.totalEggs) * 100;
                    return (
                      <div key={grade} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${getGradeColor(grade)}`} />
                            <span className="font-medium">{getGradeLabel(grade)}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{count.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* Quality Analysis Tab */}
        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Analysis</CardTitle>
              <CardDescription>Detailed quality metrics and breakdowns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{data.qualityScore}%</div>
                    <div className="text-sm text-muted-foreground">Overall Quality Score</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{data.productionEfficiency.qualityRate}%</div>
                    <div className="text-sm text-muted-foreground">Quality Rate</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{data.productionEfficiency.eggsPerBird}</div>
                    <div className="text-sm text-muted-foreground">Eggs per Bird</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {Object.entries(data.gradeBreakdown).map(([grade, count]) => {
                    const percentage = (count / data.totalEggs) * 100;
                    return (
                      <div key={grade} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${getGradeColor(grade)}`} />
                            <span className="font-semibold">{getGradeLabel(grade)}</span>
                          </div>
                          <Badge variant="outline">
                            {count.toLocaleString()} eggs
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                          <span>Percentage of total production</span>
                          <span>{percentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Daily Production Tab */}
        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Production (Last 7 Days)</CardTitle>
              <CardDescription>Daily production volume and quality breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.dailyProduction.map((day) => (
                  <div key={day.date} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">
                        {new Date(day.date).toLocaleDateString()}
                      </h3>
                      <Badge variant="outline">
                        {day.total.toLocaleString()} eggs
                      </Badge>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flock Performance Tab */}
        <TabsContent value="flocks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Flock Production Performance</CardTitle>
              <CardDescription>Production metrics by flock</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.flockProduction.map((flock) => (
                  <div key={flock.flockId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{flock.flockCode}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {flock.breed.replace('_', ' ')} • {flock.totalEggs.toLocaleString()} total eggs
                        </p>
                      </div>
                      <Badge variant={flock.qualityScore >= 90 ? "default" : "secondary"}>
                        {flock.qualityScore}% quality
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Daily Average</div>
                        <div className="font-medium">{flock.dailyAverage} eggs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Quality Score</div>
                        <div className="font-medium">{flock.qualityScore}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Total Production</div>
                        <div className="font-medium">{flock.totalEggs.toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Quality Score</span>
                        <span>{flock.qualityScore}%</span>
                      </div>
                      <Progress value={flock.qualityScore} className="h-2" />
                    </div>
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
              <CardTitle>Production Trends</CardTitle>
              <CardDescription>Monthly production trends and patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.monthlyTrends.map((month) => (
                  <div key={month.month} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{month.month}</h3>
                      <Badge variant="outline">
                        {month.totalEggs.toLocaleString()} eggs
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Total Eggs</div>
                        <div className="font-medium">{month.totalEggs.toLocaleString()}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Quality Score</div>
                        <div className="font-medium">{month.qualityScore}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Daily Average</div>
                        <div className="font-medium">{month.dailyAverage}</div>
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
