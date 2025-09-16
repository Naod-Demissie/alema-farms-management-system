"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  MapPin,
  Activity,
  Target,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { Flock } from "./flock-types";

interface FlockStatisticsProps {
  statistics: any;
  flocks: Flock[];
}

export function FlockStatistics({ statistics, flocks }: FlockStatisticsProps) {
  if (!statistics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No statistics data available</p>
        </div>
      </div>
    );
  }

  // Calculate additional statistics
  const healthyFlocks = flocks.filter(flock => {
    const mortalityRate = ((flock.initialCount - flock.currentCount) / flock.initialCount) * 100;
    return mortalityRate <= 5;
  }).length;

  const atRiskFlocks = flocks.filter(flock => {
    const mortalityRate = ((flock.initialCount - flock.currentCount) / flock.initialCount) * 100;
    return mortalityRate > 15;
  }).length;

  const averageFlockSize = flocks.length > 0 
    ? Math.round(flocks.reduce((sum, flock) => sum + flock.currentCount, 0) / flocks.length)
    : 0;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Flock Statistics</h2>
        <p className="text-muted-foreground">
          Detailed statistical analysis of your flock management
        </p>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flocks</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalFlocks}</div>
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
            <div className="text-2xl font-bold">{statistics.totalBirds.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Birds across all flocks
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Flock Size</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageFlockSize.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Birds per flock
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Flocks</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.recentFlocks}</div>
            <p className="text-xs text-muted-foreground">
              Added in last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Health Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy Flocks</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{healthyFlocks}</div>
            <p className="text-xs text-muted-foreground">
              Mortality rate &le; 5%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk Flocks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{atRiskFlocks}</div>
            <p className="text-xs text-muted-foreground">
              Mortality rate &gt; 15%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Mortality</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.averageMortalityRate}%</div>
            <p className="text-xs text-muted-foreground">
              Across all flocks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breed Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="h-5 w-5" />
            <span>Breed Analysis</span>
          </CardTitle>
          <CardDescription>
            Detailed breakdown by breed type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {statistics.flocksByBreed.map((breed: any) => {
              const percentage = (breed.count / statistics.totalFlocks) * 100;
              const birdPercentage = (breed.birds / statistics.totalBirds) * 100;
              
              return (
                <div key={breed.breed} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${getBreedColor(breed.breed)}`} />
                      <span className="font-medium capitalize text-lg">
                        {breed.breed.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{breed.count}</div>
                      <div className="text-sm text-muted-foreground">
                        {percentage.toFixed(1)}% of flocks
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total Birds</div>
                      <div className="font-medium text-lg">{breed.birds.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {birdPercentage.toFixed(1)}% of total birds
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Average Flock Size</div>
                      <div className="font-medium text-lg">
                        {Math.round(breed.birds / breed.count).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        birds per flock
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${getBreedColor(breed.breed)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Source Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Source Analysis</span>
          </CardTitle>
          <CardDescription>
            Detailed breakdown by source type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {statistics.flocksBySource.map((source: any) => {
              const percentage = (source.count / statistics.totalFlocks) * 100;
              const birdPercentage = (source.birds / statistics.totalBirds) * 100;
              
              return (
                <div key={source.source} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${getSourceColor(source.source)}`} />
                      <span className="font-medium capitalize text-lg">
                        {source.source}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{source.count}</div>
                      <div className="text-sm text-muted-foreground">
                        {percentage.toFixed(1)}% of flocks
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total Birds</div>
                      <div className="font-medium text-lg">{source.birds.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {birdPercentage.toFixed(1)}% of total birds
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Average Flock Size</div>
                      <div className="font-medium text-lg">
                        {Math.round(source.birds / source.count).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        birds per flock
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${getSourceColor(source.source)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Performance Summary</span>
          </CardTitle>
          <CardDescription>
            Overall performance metrics and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-medium">Key Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Investment (Birds):</span>
                  <span className="font-medium">{statistics.totalBirds.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Mortality Rate:</span>
                  <span className={`font-medium ${
                    statistics.averageMortalityRate > 10 ? 'text-red-600' : 
                    statistics.averageMortalityRate > 5 ? 'text-yellow-600' : 
                    'text-green-600'
                  }`}>
                    {statistics.averageMortalityRate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Healthy Flock Rate:</span>
                  <span className="font-medium text-green-600">
                    {((healthyFlocks / statistics.totalFlocks) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>At Risk Flock Rate:</span>
                  <span className="font-medium text-red-600">
                    {((atRiskFlocks / statistics.totalFlocks) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Recommendations</h4>
              <div className="space-y-2 text-sm">
                {statistics.averageMortalityRate > 10 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="font-medium text-red-800">High Mortality Alert</div>
                    <div className="text-red-700">
                      Consider reviewing health protocols and veterinary care
                    </div>
                  </div>
                )}
                {atRiskFlocks > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="font-medium text-yellow-800">At Risk Flocks</div>
                    <div className="text-yellow-700">
                      {atRiskFlocks} flocks need immediate attention
                    </div>
                  </div>
                )}
                {healthyFlocks === statistics.totalFlocks && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="font-medium text-green-800">Excellent Performance</div>
                    <div className="text-green-700">
                      All flocks are performing within healthy parameters
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
