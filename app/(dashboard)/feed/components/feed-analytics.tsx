"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, Calendar } from "lucide-react";

// Mock data for demonstration
const mockAnalytics = {
  totalFeedCost: 12500.50,
  totalFeedUsed: 2500.75,
  averageCostPerKg: 5.00,
  monthlyTrend: [
    { month: "Jan", cost: 1200, usage: 240 },
    { month: "Feb", cost: 1350, usage: 270 },
    { month: "Mar", cost: 1180, usage: 236 },
    { month: "Apr", cost: 1420, usage: 284 },
    { month: "May", cost: 1380, usage: 276 },
    { month: "Jun", cost: 1550, usage: 310 },
  ],
  feedTypeBreakdown: [
    { type: "starter", cost: 3200, usage: 640, percentage: 25.6 },
    { type: "grower", cost: 4500, usage: 900, percentage: 36.0 },
    { type: "finisher", cost: 2800, usage: 560, percentage: 22.4 },
    { type: "layer", cost: 2000.50, usage: 400.75, percentage: 16.0 },
  ],
  flockUsage: [
    { flockId: "FL-2024-001", batchCode: "FL-2024-001", breed: "broiler", cost: 4500, usage: 900 },
    { flockId: "FL-2024-002", batchCode: "FL-2024-002", breed: "layer", cost: 3200, usage: 640 },
    { flockId: "FL-2024-003", batchCode: "FL-2024-003", breed: "dual_purpose", cost: 2800, usage: 560 },
  ],
  costTrends: [
    { date: "2024-01-01", cost: 5.20 },
    { date: "2024-02-01", cost: 5.00 },
    { date: "2024-03-01", cost: 5.00 },
    { date: "2024-04-01", cost: 5.00 },
    { date: "2024-05-01", cost: 5.00 },
    { date: "2024-06-01", cost: 5.00 },
  ],
};

const feedTypeLabels = {
  starter: "Starter",
  grower: "Grower",
  finisher: "Finisher",
  layer: "Layer",
  custom: "Custom"
};

const breedLabels = {
  broiler: "Broiler",
  layer: "Layer",
  dual_purpose: "Dual Purpose"
};

export function FeedAnalytics() {
  const [timeRange, setTimeRange] = useState("6months");
  const [selectedFlock, setSelectedFlock] = useState("all");
  const [loading, setLoading] = useState(false);

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const currentMonth = mockAnalytics.monthlyTrend[mockAnalytics.monthlyTrend.length - 1];
  const previousMonth = mockAnalytics.monthlyTrend[mockAnalytics.monthlyTrend.length - 2];
  const costTrend = calculateTrend(currentMonth.cost, previousMonth.cost);
  const usageTrend = calculateTrend(currentMonth.usage, previousMonth.usage);

  return (
    <div className="space-y-6">
      {/* Time Range and Filter Controls */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedFlock} onValueChange={setSelectedFlock}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select flock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Flocks</SelectItem>
              {mockAnalytics.flockUsage.map((flock) => (
                <SelectItem key={flock.flockId} value={flock.flockId}>
                  {flock.batchCode} ({breedLabels[flock.breed as keyof typeof breedLabels]})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feed Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">${mockAnalytics.totalFeedCost.toFixed(2)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {costTrend > 0 ? (
                    <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                  )}
                  <span className={costTrend > 0 ? "text-red-500" : "text-green-500"}>
                    {Math.abs(costTrend).toFixed(1)}% from last month
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feed Used</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{mockAnalytics.totalFeedUsed.toFixed(1)} kg</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {usageTrend > 0 ? (
                    <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                  )}
                  <span className={usageTrend > 0 ? "text-red-500" : "text-green-500"}>
                    {Math.abs(usageTrend).toFixed(1)}% from last month
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost per Kg</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">${mockAnalytics.averageCostPerKg.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Per kilogram of feed
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Flocks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{mockAnalytics.flockUsage.length}</div>
                <p className="text-xs text-muted-foreground">
                  Currently feeding
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Feed Cost & Usage</CardTitle>
            <CardDescription>
              Track your feed costs and usage over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAnalytics.monthlyTrend.map((month, index) => (
                <div key={month.month} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 text-sm font-medium">{month.month}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(month.cost / 1600) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">${month.cost}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {month.usage} kg used
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feed Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Feed Type Distribution</CardTitle>
            <CardDescription>
              Breakdown of costs by feed type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAnalytics.feedTypeBreakdown.map((feed) => (
                <div key={feed.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {feedTypeLabels[feed.type as keyof typeof feedTypeLabels]}
                      </Badge>
                      <span className="text-sm font-medium">${feed.cost.toFixed(2)}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {feed.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${feed.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {feed.usage} kg used
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flock Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Flock Feed Performance</CardTitle>
          <CardDescription>
            Compare feed costs and usage across different flocks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAnalytics.flockUsage.map((flock) => (
              <div key={flock.flockId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{flock.batchCode}</span>
                    <Badge variant="outline">
                      {breedLabels[flock.breed as keyof typeof breedLabels]}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Feed cost: ${flock.cost.toFixed(2)} | Usage: {flock.usage} kg
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    ${(flock.cost / flock.usage).toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    per kg
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cost Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Feed Cost Trends</CardTitle>
          <CardDescription>
            Track how feed costs have changed over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Cost per kg over time</div>
              <div className="text-sm text-muted-foreground">
                Last 6 months
              </div>
            </div>
            <div className="space-y-2">
              {mockAnalytics.costTrends.map((trend, index) => (
                <div key={trend.date} className="flex items-center justify-between">
                  <div className="text-sm">
                    {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${(trend.cost / 5.5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      ${trend.cost.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
