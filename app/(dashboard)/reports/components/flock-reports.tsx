"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
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

interface FlockReportsProps {
  filters: ReportFilters;
}

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
  flocksBySource: Array<{
    source: string;
    count: number;
    birds: number;
    percentage: number;
  }>;
  flockPerformance: Array<{
    flockId: string;
    batchCode: string;
    breed: string;
    source: string;
    initialCount: number;
    currentCount: number;
    mortalityRate: number;
    healthScore: number;
    age: number;
    status: 'healthy' | 'at_risk' | 'critical';
  }>;
  mortalityTrends: Array<{
    month: string;
    deaths: number;
    rate: number;
  }>;
  breedPerformance: Array<{
    breed: string;
    avgMortalityRate: number;
    avgHealthScore: number;
    totalBirds: number;
  }>;
}

export function FlockReports({ filters }: FlockReportsProps) {
  const [data, setData] = useState<FlockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchFlockData();
  }, [filters]);

  const fetchFlockData = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockData: FlockData = {
        totalFlocks: 12,
        totalBirds: 2400,
        averageMortalityRate: 2.3,
        flocksByBreed: [
          { breed: "broiler", count: 6, birds: 1200, percentage: 50.0 },
          { breed: "layer", count: 4, birds: 800, percentage: 33.3 },
          { breed: "dual_purpose", count: 2, birds: 400, percentage: 16.7 }
        ],
        flocksBySource: [
          { source: "hatchery", count: 8, birds: 1600, percentage: 66.7 },
          { source: "farm", count: 3, birds: 600, percentage: 25.0 },
          { source: "imported", count: 1, birds: 200, percentage: 8.3 }
        ],
        flockPerformance: [
          {
            flockId: "1",
            batchCode: "A-001",
            breed: "broiler",
            source: "hatchery",
            initialCount: 500,
            currentCount: 485,
            mortalityRate: 3.0,
            healthScore: 85,
            age: 45,
            status: 'healthy'
          },
          {
            flockId: "2",
            batchCode: "B-002",
            breed: "layer",
            source: "farm",
            initialCount: 300,
            currentCount: 290,
            mortalityRate: 3.3,
            healthScore: 78,
            age: 120,
            status: 'at_risk'
          },
          {
            flockId: "3",
            batchCode: "C-003",
            breed: "dual_purpose",
            source: "hatchery",
            initialCount: 200,
            currentCount: 180,
            mortalityRate: 10.0,
            healthScore: 65,
            age: 90,
            status: 'critical'
          }
        ],
        mortalityTrends: [
          { month: "Jan", deaths: 8, rate: 2.1 },
          { month: "Feb", deaths: 6, rate: 1.8 },
          { month: "Mar", deaths: 12, rate: 3.2 },
          { month: "Apr", deaths: 7, rate: 2.0 },
          { month: "May", deaths: 5, rate: 1.5 },
          { month: "Jun", deaths: 9, rate: 2.4 }
        ],
        breedPerformance: [
          { breed: "broiler", avgMortalityRate: 2.1, avgHealthScore: 88, totalBirds: 1200 },
          { breed: "layer", avgMortalityRate: 2.8, avgHealthScore: 82, totalBirds: 800 },
          { breed: "dual_purpose", avgMortalityRate: 3.5, avgHealthScore: 75, totalBirds: 400 }
        ]
      };
      
      setData(mockData);
    } catch (error) {
      console.error("Error fetching flock data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    console.log(`Exporting flock report as ${format}`);
    // Implement export logic
  };

  const getBreedColor = (breed: string) => {
    switch (breed) {
      case 'broiler': return 'bg-blue-500';
      case 'layer': return 'bg-green-500';
      case 'dual_purpose': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'hatchery': return 'bg-orange-500';
      case 'farm': return 'bg-teal-500';
      case 'imported': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'at_risk': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
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
        <p className="text-muted-foreground">No flock data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flocks</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalFlocks}</div>
            <p className="text-xs text-muted-foreground">
              Active flocks in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Birds</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalBirds.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Birds across all flocks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Mortality Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averageMortalityRate}%</div>
            <p className="text-xs text-muted-foreground">
              Across all flocks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">82%</div>
            <p className="text-xs text-muted-foreground">
              Average health score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Flock Performance</TabsTrigger>
            <TabsTrigger value="mortality">Mortality Analysis</TabsTrigger>
            <TabsTrigger value="breeds">Breed Analysis</TabsTrigger>
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
                  Breed Distribution
                </CardTitle>
                <CardDescription>Distribution of flocks by breed type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.flocksByBreed.map((breed) => (
                    <div key={breed.breed} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getBreedColor(breed.breed)}`} />
                          <span className="font-medium capitalize">
                            {breed.breed.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{breed.count}</div>
                          <div className="text-sm text-muted-foreground">
                            {breed.percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <Progress value={breed.percentage} className="h-2" />
                      <div className="text-sm text-muted-foreground">
                        {breed.birds.toLocaleString()} birds
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Source Distribution
                </CardTitle>
                <CardDescription>Distribution of flocks by source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.flocksBySource.map((source) => (
                    <div key={source.source} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getSourceColor(source.source)}`} />
                          <span className="font-medium capitalize">
                            {source.source}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{source.count}</div>
                          <div className="text-sm text-muted-foreground">
                            {source.percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <Progress value={source.percentage} className="h-2" />
                      <div className="text-sm text-muted-foreground">
                        {source.birds.toLocaleString()} birds
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Flock Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Flock Performance Overview</CardTitle>
              <CardDescription>Performance metrics for each flock</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.flockPerformance.map((flock) => (
                  <div key={flock.flockId} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{flock.batchCode}</Badge>
                        <Badge variant="secondary" className="capitalize">
                          {flock.breed.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {flock.source}
                        </Badge>
                        <Badge className={getStatusColor(flock.status)}>
                          {flock.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        {flock.mortalityRate <= 5 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : flock.mortalityRate > 10 ? (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        ) : null}
                        <span className={`font-medium ${
                          flock.mortalityRate <= 5 ? 'text-green-600' : 
                          flock.mortalityRate > 10 ? 'text-red-600' : 
                          'text-yellow-600'
                        }`}>
                          {flock.mortalityRate.toFixed(1)}% mortality
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Initial Count</div>
                        <div className="font-medium">{flock.initialCount.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Current Count</div>
                        <div className="font-medium">{flock.currentCount.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Health Score</div>
                        <div className="font-medium">{flock.healthScore}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Age (days)</div>
                        <div className="font-medium">{flock.age}</div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          flock.mortalityRate <= 5 ? 'bg-green-500' : 
                          flock.mortalityRate > 10 ? 'bg-red-500' : 
                          'bg-yellow-500'
                        }`}
                        style={{ 
                          width: `${Math.max(0, 100 - flock.mortalityRate)}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mortality Analysis Tab */}
        <TabsContent value="mortality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mortality Analysis</CardTitle>
              <CardDescription>Mortality trends and patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.mortalityTrends.map((month) => (
                  <div key={month.month} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{month.month}</h3>
                      <Badge variant={month.rate <= 3 ? "default" : "destructive"}>
                        {month.rate}% rate
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Total deaths: {month.deaths}</span>
                      <span>Mortality rate: {month.rate}%</span>
                    </div>
                    <Progress 
                      value={Math.min(month.rate * 10, 100)} 
                      className="mt-2" 
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breed Analysis Tab */}
        <TabsContent value="breeds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Breed Performance Analysis</CardTitle>
              <CardDescription>Performance comparison across different breeds</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.breedPerformance.map((breed) => (
                  <div key={breed.breed} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold capitalize">
                        {breed.breed.replace('_', ' ')}
                      </h3>
                      <Badge variant="outline">
                        {breed.totalBirds.toLocaleString()} birds
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Avg Mortality Rate</div>
                        <div className="font-medium">{breed.avgMortalityRate}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Avg Health Score</div>
                        <div className="font-medium">{breed.avgHealthScore}%</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Mortality Rate</span>
                        <span>{breed.avgMortalityRate}%</span>
                      </div>
                      <Progress value={breed.avgMortalityRate * 10} className="h-2" />
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
              <CardTitle>Flock Trends</CardTitle>
              <CardDescription>Historical trends and patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Trend charts would be integrated here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
