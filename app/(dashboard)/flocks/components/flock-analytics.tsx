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
  Activity
} from "lucide-react";
import { Flock } from "./flock-types";

interface FlockAnalyticsProps {
  flocks: Flock[];
  statistics: any;
}

export function FlockAnalytics({ flocks, statistics }: FlockAnalyticsProps) {
  if (!statistics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No analytics data available</p>
        </div>
      </div>
    );
  }

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
        <h2 className="text-2xl font-bold">Flock Analytics</h2>
        <p className="text-muted-foreground">
          Comprehensive analysis of your flock performance and trends
        </p>
      </div>

      {/* Key Metrics */}
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
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Mortality Rate</CardTitle>
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

      {/* Breed Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Breed Distribution</span>
            </CardTitle>
            <CardDescription>
              Distribution of flocks by breed type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statistics.flocksByBreed.map((breed: any, index: number) => {
                const percentage = (breed.count / statistics.totalFlocks) * 100;
                return (
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
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getBreedColor(breed.breed)}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {breed.birds.toLocaleString()} birds
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Source Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Source Distribution</span>
            </CardTitle>
            <CardDescription>
              Distribution of flocks by source
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statistics.flocksBySource.map((source: any, index: number) => {
                const percentage = (source.count / statistics.totalFlocks) * 100;
                return (
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
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getSourceColor(source.source)}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {source.birds.toLocaleString()} birds
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flock Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Flock Performance Overview</span>
          </CardTitle>
          <CardDescription>
            Performance metrics for each flock
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {flocks.map((flock) => {
              const mortalityRate = ((flock.initialCount - flock.currentCount) / flock.initialCount) * 100;
              const isHealthy = mortalityRate <= 5;
              const isAtRisk = mortalityRate > 15;
              
              return (
                <div key={flock.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">{flock.batchCode}</Badge>
                      <Badge variant="secondary" className="capitalize">
                        {flock.breed.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {flock.source}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isHealthy ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : isAtRisk ? (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      ) : null}
                      <span className={`font-medium ${
                        isHealthy ? 'text-green-600' : 
                        isAtRisk ? 'text-red-600' : 
                        'text-yellow-600'
                      }`}>
                        {mortalityRate.toFixed(1)}% mortality
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Initial Count</div>
                      <div className="font-medium">{flock.initialCount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Current Count</div>
                      <div className="font-medium">{flock.currentCount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Loss</div>
                      <div className="font-medium text-red-600">
                        {(flock.initialCount - flock.currentCount).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        isHealthy ? 'bg-green-500' : 
                        isAtRisk ? 'bg-red-500' : 
                        'bg-yellow-500'
                      }`}
                      style={{ 
                        width: `${Math.max(0, 100 - mortalityRate)}%` 
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
