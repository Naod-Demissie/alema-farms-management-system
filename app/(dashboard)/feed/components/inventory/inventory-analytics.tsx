"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, TrendingUp, Calendar, Package, Clock, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { getInventoryProjectionAction, getFeedConsumptionAnalyticsAction } from "@/app/(dashboard)/feed/server/feed-inventory";
import { feedTypeLabels, feedTypeColors } from "../../utils/feed-program";

// Utility function to format numbers with commas
const formatNumber = (num: number) => {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export function InventoryAnalytics() {
  const [projections, setProjections] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'projections' | 'analytics'>('projections');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectionsResult, analyticsResult] = await Promise.all([
        getInventoryProjectionAction(),
        getFeedConsumptionAnalyticsAction()
      ]);

      if (projectionsResult.success) {
        setProjections(projectionsResult.data || []);
      }
      if (analyticsResult.success) {
        setAnalytics(analyticsResult.data || null);
      }
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const getProjectionStatus = (item: any) => {
    if (item.daysUntilOutOfStock === null) {
      return { status: 'no-usage', color: 'bg-gray-100 text-gray-800' };
    }
    if (item.daysUntilOutOfStock <= 3) {
      return { status: 'critical', color: 'bg-red-100 text-red-800' };
    }
    if (item.daysUntilOutOfStock <= 7) {
      return { status: 'urgent', color: 'bg-orange-100 text-orange-800' };
    }
    if (item.daysUntilLowStock && item.daysUntilLowStock <= 14) {
      return { status: 'warning', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { status: 'good', color: 'bg-green-100 text-green-800' };
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Inventory Analytics</CardTitle>
            <CardDescription>
              Track consumption patterns and forecast inventory needs.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'projections' | 'analytics')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="projections">Projections</TabsTrigger>
              <TabsTrigger value="analytics">Consumption Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="projections" className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading projections...</p>
                  </div>
                </div>
              ) : projections.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No inventory projections available</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {projections.map((item) => {
                    const projectionStatus = getProjectionStatus(item);
                    
                    return (
                      <Card key={item.id} className="overflow-hidden">
                        <CardHeader className="bg-muted/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                                <Package className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <Badge className={`${feedTypeColors[item.feedType as keyof typeof feedTypeColors]} text-sm font-semibold px-3 py-1`}>
                                    {feedTypeLabels[item.feedType as keyof typeof feedTypeLabels]}
                                  </Badge>
                                  <Badge className={`${projectionStatus.color} text-sm px-3 py-1`}>
                                    {projectionStatus.status === 'critical' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                    {projectionStatus.status === 'urgent' && <Clock className="w-3 h-3 mr-1" />}
                                    {projectionStatus.status === 'warning' && <TrendingUp className="w-3 h-3 mr-1" />}
                                    {projectionStatus.status === 'good' && <Package className="w-3 h-3 mr-1" />}
                                    {projectionStatus.status === 'critical' ? 'Critical' :
                                     projectionStatus.status === 'urgent' ? 'Urgent' :
                                     projectionStatus.status === 'warning' ? 'Warning' :
                                     projectionStatus.status === 'no-usage' ? 'No Usage' : 'Good'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {item.supplier?.name || 'No supplier'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">{item.quantity.toFixed(1)} kg</div>
                              <div className="text-sm text-muted-foreground">Current stock</div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-muted-foreground">Daily Usage</div>
                              <div className="text-lg font-semibold">
                                {item.averageDailyUsage.toFixed(1)} kg/day
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Based on last 30 days
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-muted-foreground">Days Remaining</div>
                              <div className="text-lg font-semibold">
                                {item.daysUntilOutOfStock ? 
                                  `${Math.round(item.daysUntilOutOfStock)} days` : 
                                  'No usage data'
                                }
                              </div>
                              {item.outOfStockDate && (
                                <div className="text-xs text-muted-foreground">
                                  Out by {formatDate(item.outOfStockDate)}
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-muted-foreground">Low Stock Alert</div>
                              <div className="text-lg font-semibold">
                                {item.daysUntilLowStock ? 
                                  `${Math.round(item.daysUntilLowStock)} days` : 
                                  'No alert set'
                                }
                              </div>
                              {item.lowStockDate && (
                                <div className="text-xs text-muted-foreground">
                                  Low by {formatDate(item.lowStockDate)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Projection Chart */}
                          <div className="mt-6">
                            <div className="text-sm font-medium text-muted-foreground mb-3">30-Day Projection</div>
                            <div className="h-32 bg-muted/30 rounded-lg p-4 flex items-end space-x-1">
                              {item.projections.slice(0, 30).map((projection: any, index: number) => {
                                const height = Math.max(4, (projection.projectedStock / item.quantity) * 100);
                                return (
                                  <div
                                    key={index}
                                    className={`flex-1 rounded-sm ${
                                      projection.isOutOfStock ? 'bg-red-500' :
                                      projection.isLowStock ? 'bg-yellow-500' : 'bg-primary'
                                    }`}
                                    style={{ height: `${height}%` }}
                                    title={`${formatDate(projection.date)}: ${projection.projectedStock.toFixed(1)} kg`}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="analytics" className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading analytics...</p>
                  </div>
                </div>
              ) : !analytics ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No consumption data available</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        {loading ? (
                          <div className="text-2xl font-bold">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        ) : (
                          <>
                            <div className="text-2xl font-bold">{analytics.summary.totalUsage.toFixed(1)} kg</div>
                            <p className="text-xs text-muted-foreground">
                              {analytics.summary.totalRecords} records
                            </p>
                          </>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        {loading ? (
                          <div className="text-2xl font-bold">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        ) : (
                          <>
                            <div className="text-2xl font-bold">{formatNumber(analytics.summary.totalCost)} ETB</div>
                            <p className="text-xs text-muted-foreground">
                              {formatNumber(analytics.summary.averageCostPerKg)} ETB/kg avg
                            </p>
                          </>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Flocks</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        {loading ? (
                          <div className="text-2xl font-bold">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        ) : (
                          <>
                            <div className="text-2xl font-bold">{analytics.summary.uniqueFlocks}</div>
                            <p className="text-xs text-muted-foreground">
                              Flocks consuming feed
                            </p>
                          </>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Feed Types</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        {loading ? (
                          <div className="text-2xl font-bold">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        ) : (
                          <>
                            <div className="text-2xl font-bold">{analytics.analytics.length}</div>
                            <p className="text-xs text-muted-foreground">
                              Different feed types used
                            </p>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Feed Type Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Feed Type Consumption</CardTitle>
                      <CardDescription>
                        Breakdown of consumption by feed type
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analytics.analytics.map((feedType: any) => (
                          <div key={feedType.feedType} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Badge className={`${feedTypeColors[feedType.feedType as keyof typeof feedTypeColors]} text-sm font-semibold px-3 py-1`}>
                                {feedTypeLabels[feedType.feedType as keyof typeof feedTypeLabels]}
                              </Badge>
                              <div>
                                <div className="font-medium">{feedType.totalUsage.toFixed(1)} kg</div>
                                <div className="text-sm text-muted-foreground">
                                  {feedType.flocks.length} flocks • {feedType.recordCount} records
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{formatNumber(feedType.totalCost)} ETB</div>
                              <div className="text-sm text-muted-foreground">
                                {formatNumber(feedType.averageCostPerKg)} ETB/kg
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
