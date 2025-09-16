"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Utensils, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Calendar,
  Package,
  AlertTriangle,
  CheckCircle,
  DollarSign,
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

interface FeedReportsProps {
  filters: ReportFilters;
}

interface FeedData {
  totalFeedUsed: number;
  totalFeedCost: number;
  averageDailyConsumption: number;
  feedEfficiency: number;
  inventoryValue: number;
  lowStockItems: number;
  feedByType: Array<{
    type: string;
    quantity: number;
    cost: number;
    percentage: number;
  }>;
  feedBySupplier: Array<{
    supplier: string;
    quantity: number;
    cost: number;
    percentage: number;
  }>;
  dailyConsumption: Array<{
    date: string;
    totalUsed: number;
    cost: number;
    efficiency: number;
  }>;
  flockFeedUsage: Array<{
    flockId: string;
    flockCode: string;
    breed: string;
    totalUsed: number;
    cost: number;
    efficiency: number;
  }>;
  inventoryStatus: Array<{
    feedId: string;
    name: string;
    type: string;
    currentStock: number;
    minStock: number;
    maxStock: number;
    costPerUnit: number;
    status: 'low' | 'adequate' | 'high';
  }>;
  monthlyTrends: Array<{
    month: string;
    totalUsed: number;
    totalCost: number;
    efficiency: number;
  }>;
}

export function FeedReports({ filters }: FeedReportsProps) {
  const [data, setData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchFeedData();
  }, [filters]);

  const fetchFeedData = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockData: FeedData = {
        totalFeedUsed: 12500,
        totalFeedCost: 18750,
        averageDailyConsumption: 416.7,
        feedEfficiency: 78.5,
        inventoryValue: 25000,
        lowStockItems: 3,
        feedByType: [
          { type: "starter", quantity: 3000, cost: 4500, percentage: 24.0 },
          { type: "grower", quantity: 4000, cost: 6000, percentage: 32.0 },
          { type: "finisher", quantity: 3500, cost: 5250, percentage: 28.0 },
          { type: "layer", quantity: 2000, cost: 3000, percentage: 16.0 }
        ],
        feedBySupplier: [
          { supplier: "ABC Feeds", quantity: 5000, cost: 7500, percentage: 40.0 },
          { supplier: "XYZ Nutrition", quantity: 4000, cost: 6000, percentage: 32.0 },
          { supplier: "Premium Poultry", quantity: 3500, cost: 5250, percentage: 28.0 }
        ],
        dailyConsumption: [
          { date: "2024-01-01", totalUsed: 420, cost: 630, efficiency: 80 },
          { date: "2024-01-02", totalUsed: 410, cost: 615, efficiency: 78 },
          { date: "2024-01-03", totalUsed: 430, cost: 645, efficiency: 82 },
          { date: "2024-01-04", totalUsed: 415, cost: 622, efficiency: 79 },
          { date: "2024-01-05", totalUsed: 425, cost: 637, efficiency: 81 },
          { date: "2024-01-06", totalUsed: 400, cost: 600, efficiency: 76 },
          { date: "2024-01-07", totalUsed: 435, cost: 652, efficiency: 83 }
        ],
        flockFeedUsage: [
          { flockId: "1", flockCode: "A-001", breed: "broiler", totalUsed: 5000, cost: 7500, efficiency: 85 },
          { flockId: "2", flockCode: "B-002", breed: "layer", totalUsed: 4000, cost: 6000, efficiency: 75 },
          { flockId: "3", flockCode: "C-003", breed: "dual_purpose", totalUsed: 3500, cost: 5250, efficiency: 70 }
        ],
        inventoryStatus: [
          { feedId: "1", name: "Starter Feed A", type: "starter", currentStock: 500, minStock: 200, maxStock: 1000, costPerUnit: 1.5, status: 'adequate' },
          { feedId: "2", name: "Grower Feed B", type: "grower", currentStock: 150, minStock: 300, maxStock: 800, costPerUnit: 1.5, status: 'low' },
          { feedId: "3", name: "Layer Feed C", type: "layer", currentStock: 800, minStock: 200, maxStock: 600, costPerUnit: 1.5, status: 'high' }
        ],
        monthlyTrends: [
          { month: "Jan", totalUsed: 12500, totalCost: 18750, efficiency: 78.5 },
          { month: "Feb", totalUsed: 11800, totalCost: 17700, efficiency: 76.2 },
          { month: "Mar", totalUsed: 13200, totalCost: 19800, efficiency: 80.1 },
          { month: "Apr", totalUsed: 12800, totalCost: 19200, efficiency: 77.8 },
          { month: "May", totalUsed: 13500, totalCost: 20250, efficiency: 81.3 },
          { month: "Jun", totalUsed: 13000, totalCost: 19500, efficiency: 79.2 }
        ]
      };
      
      setData(mockData);
    } catch (error) {
      console.error("Error fetching feed data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    console.log(`Exporting feed report as ${format}`);
    // Implement export logic
  };

  const getFeedTypeColor = (type: string) => {
    switch (type) {
      case 'starter': return 'bg-blue-500';
      case 'grower': return 'bg-green-500';
      case 'finisher': return 'bg-orange-500';
      case 'layer': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getSupplierColor = (supplier: string) => {
    switch (supplier) {
      case 'ABC Feeds': return 'bg-red-500';
      case 'XYZ Nutrition': return 'bg-yellow-500';
      case 'Premium Poultry': return 'bg-teal-500';
      default: return 'bg-gray-500';
    }
  };

  const getInventoryStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'text-red-600 bg-red-100';
      case 'adequate': return 'text-green-600 bg-green-100';
      case 'high': return 'text-yellow-600 bg-yellow-100';
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
        <p className="text-muted-foreground">No feed data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feed Used</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totalFeedUsed.toLocaleString()} kg
            </div>
            <p className="text-xs text-muted-foreground">
              Total consumption
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feed Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data.totalFeedCost.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total expenditure
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feed Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.feedEfficiency}%</div>
            <p className="text-xs text-muted-foreground">
              Conversion efficiency
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data.inventoryValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Current stock value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="consumption">Consumption Analysis</TabsTrigger>
            <TabsTrigger value="inventory">Inventory Status</TabsTrigger>
            <TabsTrigger value="suppliers">Supplier Analysis</TabsTrigger>
            <TabsTrigger value="flocks">Flock Usage</TabsTrigger>
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
                  Feed by Type
                </CardTitle>
                <CardDescription>Distribution of feed consumption by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.feedByType.map((feed) => (
                    <div key={feed.type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getFeedTypeColor(feed.type)}`} />
                          <span className="font-medium capitalize">{feed.type}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{feed.quantity.toLocaleString()} kg</div>
                          <div className="text-sm text-muted-foreground">
                            {feed.percentage}%
                          </div>
                        </div>
                      </div>
                      <Progress value={feed.percentage} className="h-2" />
                      <div className="text-sm text-muted-foreground">
                        ${feed.cost.toLocaleString()} cost
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
                  Feed by Supplier
                </CardTitle>
                <CardDescription>Distribution of feed by supplier</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.feedBySupplier.map((supplier) => (
                    <div key={supplier.supplier} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getSupplierColor(supplier.supplier)}`} />
                          <span className="font-medium">{supplier.supplier}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{supplier.quantity.toLocaleString()} kg</div>
                          <div className="text-sm text-muted-foreground">
                            {supplier.percentage}%
                          </div>
                        </div>
                      </div>
                      <Progress value={supplier.percentage} className="h-2" />
                      <div className="text-sm text-muted-foreground">
                        ${supplier.cost.toLocaleString()} cost
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Consumption Analysis Tab */}
        <TabsContent value="consumption" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Consumption (Last 7 Days)</CardTitle>
              <CardDescription>Daily feed consumption and efficiency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.dailyConsumption.map((day) => (
                  <div key={day.date} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">
                        {new Date(day.date).toLocaleDateString()}
                      </h3>
                      <Badge variant={day.efficiency >= 80 ? "default" : "secondary"}>
                        {day.efficiency}% efficiency
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Used</div>
                        <div className="font-medium">{day.totalUsed} kg</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Cost</div>
                        <div className="font-medium">${day.cost}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Efficiency</div>
                        <div className="font-medium">{day.efficiency}%</div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Efficiency</span>
                        <span>{day.efficiency}%</span>
                      </div>
                      <Progress value={day.efficiency} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Status Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
              <CardDescription>Current feed inventory and stock levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.inventoryStatus.map((item) => (
                  <div key={item.feedId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {item.type} • ${item.costPerUnit}/kg
                        </p>
                      </div>
                      <Badge className={getInventoryStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Current Stock</div>
                        <div className="font-medium">{item.currentStock} kg</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Min Level</div>
                        <div className="font-medium">{item.minStock} kg</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Max Level</div>
                        <div className="font-medium">{item.maxStock} kg</div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Stock Level</span>
                        <span>{item.currentStock} / {item.maxStock} kg</span>
                      </div>
                      <Progress 
                        value={(item.currentStock / item.maxStock) * 100} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supplier Analysis Tab */}
        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Analysis</CardTitle>
              <CardDescription>Performance and cost analysis by supplier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data.feedBySupplier.map((supplier) => (
                  <div key={supplier.supplier} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{supplier.supplier}</h3>
                      <Badge variant="outline">
                        {supplier.quantity.toLocaleString()} kg
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                      <span>Market share</span>
                      <span>{supplier.percentage}%</span>
                    </div>
                    <Progress value={supplier.percentage} className="h-2" />
                    <div className="mt-2 text-sm text-muted-foreground">
                      Total cost: ${supplier.cost.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flock Usage Tab */}
        <TabsContent value="flocks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Flock Feed Usage</CardTitle>
              <CardDescription>Feed consumption and efficiency by flock</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.flockFeedUsage.map((flock) => (
                  <div key={flock.flockId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{flock.flockCode}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {flock.breed.replace('_', ' ')} • {flock.totalUsed.toLocaleString()} kg used
                        </p>
                      </div>
                      <Badge variant={flock.efficiency >= 80 ? "default" : "secondary"}>
                        {flock.efficiency}% efficiency
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Total Used</div>
                        <div className="font-medium">{flock.totalUsed.toLocaleString()} kg</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Total Cost</div>
                        <div className="font-medium">${flock.cost.toLocaleString()}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Efficiency</div>
                        <div className="font-medium">{flock.efficiency}%</div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Efficiency</span>
                        <span>{flock.efficiency}%</span>
                      </div>
                      <Progress value={flock.efficiency} className="h-2" />
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
              <CardTitle>Feed Trends</CardTitle>
              <CardDescription>Monthly consumption and cost trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.monthlyTrends.map((month) => (
                  <div key={month.month} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{month.month}</h3>
                      <Badge variant="outline">
                        {month.totalUsed.toLocaleString()} kg
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Total Used</div>
                        <div className="font-medium">{month.totalUsed.toLocaleString()} kg</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Total Cost</div>
                        <div className="font-medium">${month.totalCost.toLocaleString()}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Efficiency</div>
                        <div className="font-medium">{month.efficiency}%</div>
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
