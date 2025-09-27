"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Package, TrendingUp, AlertTriangle, CheckCircle, Bird, Clock, Scale, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { getDailyFeedRequirementsAction, getWeeklyFeedRequirementsAction } from "@/app/actions/feed-program";
import { getFeedInventoryAction, getInventoryWithUsageAction, getInventoryProjectionAction } from "@/app/actions/feed-inventory";
import { feedTypeLabels, feedTypeColors } from "@/lib/feed-program";

export function FeedPlanning() {
  const [dailyRequirements, setDailyRequirements] = useState<any[]>([]);
  const [weeklyRequirements, setWeeklyRequirements] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [inventoryWithUsage, setInventoryWithUsage] = useState<any[]>([]);
  const [inventoryProjections, setInventoryProjections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dailyResult, weeklyResult, inventoryResult, inventoryWithUsageResult, projectionsResult] = await Promise.all([
        getDailyFeedRequirementsAction(),
        getWeeklyFeedRequirementsAction(),
        getFeedInventoryAction(),
        getInventoryWithUsageAction(),
        getInventoryProjectionAction()
      ]);

      if (dailyResult.success) {
        setDailyRequirements(dailyResult.data || []);
      }
      if (weeklyResult.success) {
        setWeeklyRequirements(weeklyResult.data || []);
      }
      if (inventoryResult.success) {
        setInventory(inventoryResult.data || []);
      }
      if (inventoryWithUsageResult.success) {
        setInventoryWithUsage(inventoryWithUsageResult.data || []);
      }
      if (projectionsResult.success) {
        setInventoryProjections(projectionsResult.data || []);
      }
    } catch (error) {
      console.error("Error fetching planning data:", error);
      toast.error("Failed to load planning data");
    } finally {
      setLoading(false);
    }
  };

  const getInventoryStatus = (feedType: string) => {
    const feedItem = inventoryWithUsage.find(item => item.feedType === feedType && item.isActive);
    if (!feedItem) return { 
      status: 'missing', 
      quantity: 0, 
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      daysRemaining: null,
      averageDailyUsage: 0,
      isLowStock: false,
      isCriticalStock: false
    };
    
    const currentRequirements = activeTab === 'daily' ? dailyRequirements : weeklyRequirements;
    const required = currentRequirements.find(req => req.feedType === feedType)?.totalAmountKg || 0;
    const available = feedItem.quantity;
    const percentage = required > 0 ? (available / required) * 100 : 100;
    
    let status = 'sufficient';
    let color = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    
    if (feedItem.isCriticalStock) {
      status = 'critical';
      color = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    } else if (feedItem.isLowStock || percentage < 50) {
      status = 'low';
      color = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    } else if (percentage < 100) {
      status = 'insufficient';
      color = 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    }
    
    return { 
      status, 
      quantity: available, 
      color,
      daysRemaining: feedItem.daysRemaining,
      averageDailyUsage: feedItem.averageDailyUsage,
      isLowStock: feedItem.isLowStock,
      isCriticalStock: feedItem.isCriticalStock
    };
  };

  const toggleCardExpansion = (feedType: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(feedType)) {
      newExpanded.delete(feedType);
    } else {
      newExpanded.add(feedType);
    }
    setExpandedCards(newExpanded);
  };

  const currentRequirements = activeTab === 'daily' ? dailyRequirements : weeklyRequirements;
  const totalRequired = currentRequirements.reduce((sum, req) => sum + req.totalAmountKg, 0);
  const totalAvailable = inventoryWithUsage
    .filter(item => item.isActive)
    .reduce((sum, item) => sum + item.quantity, 0);
  
  const lowStockItems = inventoryWithUsage.filter(item => item.isLowStock && item.isActive);
  const criticalStockItems = inventoryWithUsage.filter(item => item.isCriticalStock && item.isActive);
  const averageDailyConsumption = inventoryWithUsage
    .filter(item => item.isActive)
    .reduce((sum, item) => sum + (item.averageDailyUsage || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {activeTab === 'daily' ? 'Daily' : 'Weekly'} Requirements
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequired.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">
              {currentRequirements.length} feed types
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Stock</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAvailable.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">
              {inventoryWithUsage.filter(item => item.isActive).length} active items
            </p>
            {averageDailyConsumption > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Avg: {averageDailyConsumption.toFixed(1)} kg/day
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRequired > 0 ? ((totalAvailable / totalRequired) * 100).toFixed(0) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Stock vs requirements
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lowStockItems.length + criticalStockItems.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {criticalStockItems.length} critical, {lowStockItems.length} low stock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feed Requirements with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Feed Requirements</CardTitle>
              <CardDescription>
                Daily and weekly feed requirements based on flock ages and feed program.
              </CardDescription>
            </div>
            <Button onClick={fetchData} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'daily' | 'weekly')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="daily" className="text-xs sm:text-sm">Daily Requirements</TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs sm:text-sm">Weekly Requirements</TabsTrigger>
            </TabsList>
            
            <TabsContent value="daily" className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading daily requirements...</p>
                  </div>
                </div>
              ) : dailyRequirements.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active flocks found</p>
                  <p className="text-sm text-muted-foreground">Add flocks to see daily feed requirements</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {dailyRequirements.map((requirement) => {
                    const inventoryStatus = getInventoryStatus(requirement.feedType);
                    const isExpanded = expandedCards.has(requirement.feedType);
                    
                    return (
                      <Card key={requirement.feedType} className="overflow-hidden hover:bg-muted/50 transition-all duration-200">
                        <CardHeader 
                          className="cursor-pointer bg-muted/30 hover:bg-muted/70 transition-colors"
                          onClick={() => toggleCardExpansion(requirement.feedType)}
                        >
                          <div className="space-y-4 lg:space-y-0">
                            {/* Mobile Layout */}
                            <div className="block lg:hidden">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm border border-primary/20">
                                    <Package className="h-6 w-6 text-primary" />
                                  </div>
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                      <Badge className={`${feedTypeColors[requirement.feedType as keyof typeof feedTypeColors]} text-sm font-semibold px-3 py-1`}>
                                        {feedTypeLabels[requirement.feedType as keyof typeof feedTypeLabels]}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        Week {requirement.ageInWeeks}
                                      </Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {requirement.ageInDays} days
                                    </div>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" className="p-2">
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-muted/30 rounded-lg p-3">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <Scale className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs font-medium text-muted-foreground">Per Hen</span>
                                  </div>
                                  <div className="text-lg font-bold text-foreground">
                                    {requirement.gramPerHen}g
                                  </div>
                                </div>
                                
                                <div className="bg-muted/30 rounded-lg p-3">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <Bird className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs font-medium text-muted-foreground">Flocks</span>
                                  </div>
                                  <div className="text-lg font-bold text-foreground">
                                    {requirement.flocksCount}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border">
                                <div>
                                  <div className="text-2xl font-bold text-foreground">
                                    {requirement.totalAmountKg.toFixed(1)} kg
                                  </div>
                                  <div className="text-sm text-muted-foreground">required today</div>
                                </div>
                                <div className="text-right">
                                  <Badge className={`${inventoryStatus.color} text-sm px-3 py-1`}>
                                    {inventoryStatus.status === 'sufficient' && <CheckCircle className="w-4 h-4 mr-1" />}
                                    {inventoryStatus.status === 'low' && <AlertTriangle className="w-4 h-4 mr-1" />}
                                    {inventoryStatus.status === 'critical' && <AlertTriangle className="w-4 h-4 mr-1" />}
                                    {inventoryStatus.status === 'missing' && <AlertTriangle className="w-4 h-4 mr-1" />}
                                    {inventoryStatus.status === 'sufficient' ? 'Sufficient' :
                                     inventoryStatus.status === 'low' ? 'Low Stock' :
                                     inventoryStatus.status === 'critical' ? 'Critical' : 
                                     inventoryStatus.status === 'insufficient' ? 'Insufficient' : 'Missing'}
                                  </Badge>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {inventoryStatus.quantity.toFixed(1)} kg available
                                    {inventoryStatus.daysRemaining && (
                                      <div className="text-xs text-muted-foreground">
                                        ~{Math.round(inventoryStatus.daysRemaining)} days left
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Desktop Layout */}
                            <div className="hidden lg:flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm border border-primary/20">
                                  <Package className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                  <div className="flex items-center space-x-3 mb-2">
                                    <Badge className={`${feedTypeColors[requirement.feedType as keyof typeof feedTypeColors]} text-sm font-semibold px-3 py-1`}>
                                      {feedTypeLabels[requirement.feedType as keyof typeof feedTypeLabels]}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      Week {requirement.ageInWeeks}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                                    <div className="flex items-center space-x-2">
                                      <Scale className="h-4 w-4" />
                                      <span>{requirement.gramPerHen}g per hen</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Bird className="h-4 w-4" />
                                      <span>{requirement.flocksCount} flocks</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Clock className="h-4 w-4" />
                                      <span>{requirement.ageInDays} days</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-foreground">
                                    {requirement.totalAmountKg.toFixed(1)} kg
                                  </div>
                                  <div className="text-sm text-muted-foreground">required today</div>
                                </div>
                                <div className="flex flex-col items-end space-y-2">
                                  <Badge className={`${inventoryStatus.color} text-sm px-3 py-1`}>
                                    {inventoryStatus.status === 'sufficient' && <CheckCircle className="w-4 h-4 mr-1" />}
                                    {inventoryStatus.status === 'low' && <AlertTriangle className="w-4 h-4 mr-1" />}
                                    {inventoryStatus.status === 'critical' && <AlertTriangle className="w-4 h-4 mr-1" />}
                                    {inventoryStatus.status === 'missing' && <AlertTriangle className="w-4 h-4 mr-1" />}
                                    {inventoryStatus.status === 'sufficient' ? 'Sufficient' :
                                     inventoryStatus.status === 'low' ? 'Low Stock' :
                                     inventoryStatus.status === 'critical' ? 'Critical' : 
                                     inventoryStatus.status === 'insufficient' ? 'Insufficient' : 'Missing'}
                                  </Badge>
                                  <div className="text-xs text-muted-foreground">
                                    {inventoryStatus.quantity.toFixed(1)} kg available
                                    {inventoryStatus.daysRemaining && (
                                      <div className="text-xs text-muted-foreground">
                                        ~{Math.round(inventoryStatus.daysRemaining)} days left
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" className="p-2">
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        
                        {isExpanded && (
                          <CardContent className="pt-0 border-t bg-muted/20">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-foreground">Flock Breakdown</div>
                                <div className="text-xs text-muted-foreground">
                                  {requirement.flocks.length} flock{requirement.flocks.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                              <div className="space-y-3">
                                {requirement.flocks.map((flock: any, index: number) => (
                                  <div key={flock.flockId} className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-card to-card/80 border border-border/50 hover:bg-muted/30 transition-all duration-200">
                                    {/* Mobile Layout */}
                                    <div className="block sm:hidden p-4">
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-xs font-bold text-primary">#{index + 1}</span>
                                          </div>
                                          <div>
                                            <div className="font-semibold text-foreground text-sm">{flock.batchCode}</div>
                                            <div className="text-xs text-muted-foreground">Batch Code</div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-lg font-bold text-foreground">
                                            {flock.amountKg.toFixed(1)} kg
                                          </div>
                                          <div className="text-xs text-muted-foreground">required today</div>
                                        </div>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-muted/30 rounded-lg p-3">
                                          <div className="flex items-center space-x-2 mb-1">
                                            <Bird className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-xs font-medium text-muted-foreground">Birds</span>
                                          </div>
                                          <div className="text-sm font-semibold text-foreground">
                                            {flock.currentCount.toLocaleString()}
                                          </div>
                                        </div>
                                        
                                        <div className="bg-muted/30 rounded-lg p-3">
                                          <div className="flex items-center space-x-2 mb-1">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-xs font-medium text-muted-foreground">Age</span>
                                          </div>
                                          <div className="text-sm font-semibold text-foreground">
                                            Week {flock.ageInWeeks}
                                          </div>
                                        </div>
                                        
                                        <div className="bg-muted/30 rounded-lg p-3">
                                          <div className="flex items-center space-x-2 mb-1">
                                            <Scale className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-xs font-medium text-muted-foreground">Per Hen</span>
                                          </div>
                                          <div className="text-sm font-semibold text-foreground">
                                            {flock.gramPerHen}g
                                          </div>
                                        </div>
                                        
                                        <div className="bg-muted/30 rounded-lg p-3">
                                          <div className="flex items-center space-x-2 mb-1">
                                            <Package className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-xs font-medium text-muted-foreground">Total</span>
                                          </div>
                                          <div className="text-sm font-semibold text-foreground">
                                            {flock.amountKg.toFixed(1)} kg
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Desktop Layout */}
                                    <div className="hidden sm:flex items-center justify-between p-4">
                                      <div className="flex items-center space-x-4">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                          <span className="text-xs font-bold text-primary">#{index + 1}</span>
                                        </div>
                                        <div>
                                          <div className="font-semibold text-foreground">{flock.batchCode}</div>
                                          <div className="text-sm text-muted-foreground">
                                            {flock.currentCount.toLocaleString()} birds • Week {flock.ageInWeeks} • {flock.gramPerHen}g/hen
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-lg font-bold text-foreground">
                                          {flock.amountKg.toFixed(1)} kg
                                        </div>
                                        <div className="text-sm text-muted-foreground">required today</div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="weekly" className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading weekly requirements...</p>
                  </div>
                </div>
              ) : weeklyRequirements.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active flocks found</p>
                  <p className="text-sm text-muted-foreground">Add flocks to see weekly feed requirements</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {weeklyRequirements.map((requirement) => {
                    const inventoryStatus = getInventoryStatus(requirement.feedType);
                    const isExpanded = expandedCards.has(requirement.feedType);
                    
                    return (
                      <Card key={requirement.feedType} className="overflow-hidden hover:bg-muted/50 transition-all duration-200">
                        <CardHeader 
                          className="cursor-pointer bg-muted/30 hover:bg-muted/70 transition-colors"
                          onClick={() => toggleCardExpansion(requirement.feedType)}
                        >
                          <div className="space-y-4 lg:space-y-0">
                            {/* Mobile Layout */}
                            <div className="block lg:hidden">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm border border-primary/20">
                                    <Package className="h-6 w-6 text-primary" />
                                  </div>
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                      <Badge className={`${feedTypeColors[requirement.feedType as keyof typeof feedTypeColors]} text-sm font-semibold px-3 py-1`}>
                                        {feedTypeLabels[requirement.feedType as keyof typeof feedTypeLabels]}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        Week {requirement.ageInWeeks}
                                      </Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {requirement.ageInDays} days
                                    </div>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" className="p-2">
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-muted/30 rounded-lg p-3">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <Scale className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs font-medium text-muted-foreground">Per Hen</span>
                                  </div>
                                  <div className="text-lg font-bold text-foreground">
                                    {requirement.gramPerHen}g
                                  </div>
                                </div>
                                
                                <div className="bg-muted/30 rounded-lg p-3">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <Bird className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs font-medium text-muted-foreground">Flocks</span>
                                  </div>
                                  <div className="text-lg font-bold text-foreground">
                                    {requirement.flocksCount}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border">
                                <div>
                                  <div className="text-2xl font-bold text-foreground">
                                    {requirement.totalAmountKg.toFixed(1)} kg
                                  </div>
                                  <div className="text-sm text-muted-foreground">required this week</div>
                                </div>
                                <div className="text-right">
                                  <Badge className={`${inventoryStatus.color} text-sm px-3 py-1`}>
                                    {inventoryStatus.status === 'sufficient' && <CheckCircle className="w-4 h-4 mr-1" />}
                                    {inventoryStatus.status === 'low' && <AlertTriangle className="w-4 h-4 mr-1" />}
                                    {inventoryStatus.status === 'critical' && <AlertTriangle className="w-4 h-4 mr-1" />}
                                    {inventoryStatus.status === 'missing' && <AlertTriangle className="w-4 h-4 mr-1" />}
                                    {inventoryStatus.status === 'sufficient' ? 'Sufficient' :
                                     inventoryStatus.status === 'low' ? 'Low Stock' :
                                     inventoryStatus.status === 'critical' ? 'Critical' : 
                                     inventoryStatus.status === 'insufficient' ? 'Insufficient' : 'Missing'}
                                  </Badge>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {inventoryStatus.quantity.toFixed(1)} kg available
                                    {inventoryStatus.daysRemaining && (
                                      <div className="text-xs text-muted-foreground">
                                        ~{Math.round(inventoryStatus.daysRemaining)} days left
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Desktop Layout */}
                            <div className="hidden lg:flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm border border-primary/20">
                                  <Package className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                  <div className="flex items-center space-x-3 mb-2">
                                    <Badge className={`${feedTypeColors[requirement.feedType as keyof typeof feedTypeColors]} text-sm font-semibold px-3 py-1`}>
                                      {feedTypeLabels[requirement.feedType as keyof typeof feedTypeLabels]}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      Week {requirement.ageInWeeks}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                                    <div className="flex items-center space-x-2">
                                      <Scale className="h-4 w-4" />
                                      <span>{requirement.gramPerHen}g per hen</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Bird className="h-4 w-4" />
                                      <span>{requirement.flocksCount} flocks</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Clock className="h-4 w-4" />
                                      <span>{requirement.ageInDays} days</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-foreground">
                                    {requirement.totalAmountKg.toFixed(1)} kg
                                  </div>
                                  <div className="text-sm text-muted-foreground">required this week</div>
                                </div>
                                <div className="flex flex-col items-end space-y-2">
                                  <Badge className={`${inventoryStatus.color} text-sm px-3 py-1`}>
                                    {inventoryStatus.status === 'sufficient' && <CheckCircle className="w-4 h-4 mr-1" />}
                                    {inventoryStatus.status === 'low' && <AlertTriangle className="w-4 h-4 mr-1" />}
                                    {inventoryStatus.status === 'critical' && <AlertTriangle className="w-4 h-4 mr-1" />}
                                    {inventoryStatus.status === 'missing' && <AlertTriangle className="w-4 h-4 mr-1" />}
                                    {inventoryStatus.status === 'sufficient' ? 'Sufficient' :
                                     inventoryStatus.status === 'low' ? 'Low Stock' :
                                     inventoryStatus.status === 'critical' ? 'Critical' : 
                                     inventoryStatus.status === 'insufficient' ? 'Insufficient' : 'Missing'}
                                  </Badge>
                                  <div className="text-xs text-muted-foreground">
                                    {inventoryStatus.quantity.toFixed(1)} kg available
                                    {inventoryStatus.daysRemaining && (
                                      <div className="text-xs text-muted-foreground">
                                        ~{Math.round(inventoryStatus.daysRemaining)} days left
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" className="p-2">
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        
                        {isExpanded && (
                          <CardContent className="pt-0 border-t bg-muted/20">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-foreground">Flock Breakdown</div>
                                <div className="text-xs text-muted-foreground">
                                  {requirement.flocks.length} flock{requirement.flocks.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                              <div className="space-y-3">
                                {requirement.flocks.map((flock: any, index: number) => (
                                  <div key={flock.flockId} className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-card to-card/80 border border-border/50 hover:bg-muted/30 transition-all duration-200">
                                    {/* Mobile Layout */}
                                    <div className="block sm:hidden p-4">
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-xs font-bold text-primary">#{index + 1}</span>
                                          </div>
                                          <div>
                                            <div className="font-semibold text-foreground text-sm">{flock.batchCode}</div>
                                            <div className="text-xs text-muted-foreground">Batch Code</div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-lg font-bold text-foreground">
                                            {flock.amountKg.toFixed(1)} kg
                                          </div>
                                          <div className="text-xs text-muted-foreground">required this week</div>
                                        </div>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-muted/30 rounded-lg p-3">
                                          <div className="flex items-center space-x-2 mb-1">
                                            <Bird className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-xs font-medium text-muted-foreground">Birds</span>
                                          </div>
                                          <div className="text-sm font-semibold text-foreground">
                                            {flock.currentCount.toLocaleString()}
                                          </div>
                                        </div>
                                        
                                        <div className="bg-muted/30 rounded-lg p-3">
                                          <div className="flex items-center space-x-2 mb-1">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-xs font-medium text-muted-foreground">Age</span>
                                          </div>
                                          <div className="text-sm font-semibold text-foreground">
                                            Week {flock.ageInWeeks}
                                          </div>
                                        </div>
                                        
                                        <div className="bg-muted/30 rounded-lg p-3">
                                          <div className="flex items-center space-x-2 mb-1">
                                            <Scale className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-xs font-medium text-muted-foreground">Per Hen</span>
                                          </div>
                                          <div className="text-sm font-semibold text-foreground">
                                            {flock.gramPerHen}g
                                          </div>
                                        </div>
                                        
                                        <div className="bg-muted/30 rounded-lg p-3">
                                          <div className="flex items-center space-x-2 mb-1">
                                            <Package className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-xs font-medium text-muted-foreground">Total</span>
                                          </div>
                                          <div className="text-sm font-semibold text-foreground">
                                            {flock.amountKg.toFixed(1)} kg
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Desktop Layout */}
                                    <div className="hidden sm:flex items-center justify-between p-4">
                                      <div className="flex items-center space-x-4">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                          <span className="text-xs font-bold text-primary">#{index + 1}</span>
                                        </div>
                                        <div>
                                          <div className="font-semibold text-foreground">{flock.batchCode}</div>
                                          <div className="text-sm text-muted-foreground">
                                            {flock.currentCount.toLocaleString()} birds • Week {flock.ageInWeeks} • {flock.gramPerHen}g/hen
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-lg font-bold text-foreground">
                                          {flock.amountKg.toFixed(1)} kg
                                        </div>
                                        <div className="text-sm text-muted-foreground">required this week</div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

    </div>
  );
}
