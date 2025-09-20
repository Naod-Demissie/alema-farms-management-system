"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Calendar,
  Download
} from "lucide-react";
import { FlockFinancialSummary, MonthlyFinancialData } from "@/features/financial/types";
import { 
  getFlockFinancialSummaries, 
  getMonthlyFinancialData 
} from "@/server/financial";
import { getFlocks } from "@/server/flocks";
import { toast } from "sonner";

interface ReportFilters {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  flockId: string;
  reportType: string;
}

interface FinancialReportsProps {
  filters: ReportFilters;
}

interface Flock {
  id: string;
  batchCode: string;
  breed: string;
  arrivalDate: Date;
}

export function FinancialReports({ filters }: FinancialReportsProps) {
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [flockFinancials, setFlockFinancials] = useState<FlockFinancialSummary[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyFinancialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlock, setSelectedFlock] = useState<string>("");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1), // Start of current year
    endDate: new Date(), // Today
  });

  useEffect(() => {
    fetchFlocks();
    fetchFinancialData();
  }, [selectedFlock, dateRange]);

  const fetchFlocks = async () => {
    try {
      const result = await getFlocks({}, { page: 1, limit: 100 });
      if (result.success && result.data) {
        setFlocks(result.data.map(flock => ({
          id: flock.id,
          batchCode: flock.batchCode,
          breed: flock.breed,
          arrivalDate: flock.arrivalDate
        })));
      } else {
        toast.error("Failed to fetch flocks");
        setFlocks([]);
      }
    } catch (error) {
      console.error("Error fetching flocks:", error);
      toast.error("Failed to fetch flocks");
      setFlocks([]);
    }
  };

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const filters = {
        flockId: selectedFlock || undefined,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };

      // Fetch flock financial summaries
      const flockResult = await getFlockFinancialSummaries(filters);
      if (flockResult.success) {
        setFlockFinancials(flockResult.data || []);
      } else {
        toast.error(flockResult.message || "Failed to fetch flock financial data");
        setFlockFinancials([]);
      }

      // Fetch monthly data
      const monthlyResult = await getMonthlyFinancialData(filters);
      if (monthlyResult.success) {
        setMonthlyData(monthlyResult.data || []);
      } else {
        toast.error(monthlyResult.message || "Failed to fetch monthly data");
        setMonthlyData([]);
      }
    } catch (error) {
      console.error("Error fetching financial data:", error);
      toast.error("Failed to fetch financial data");
      setFlockFinancials([]);
      setMonthlyData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const queryParams = new URLSearchParams();
      if (selectedFlock) queryParams.append("flockId", selectedFlock);
      if (dateRange.startDate) queryParams.append("startDate", dateRange.startDate.toISOString());
      if (dateRange.endDate) queryParams.append("endDate", dateRange.endDate.toISOString());
      queryParams.append("format", format);

      const response = await fetch(`/api/financial/reports/export?${queryParams}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financial-report-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exporting report:", error);
    }
  };

  const totalExpenses = flockFinancials.reduce((sum, f) => sum + f.totalExpenses, 0);
  const totalRevenue = flockFinancials.reduce((sum, f) => sum + f.totalRevenue, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Filters and Export */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Customize your financial report parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="flock-filter">Flock</Label>
              <Select
                value={selectedFlock || "all"}
                onValueChange={(value) => setSelectedFlock(value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Flocks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Flocks</SelectItem>
                  {flocks.map((flock) => (
                    <SelectItem key={flock.id} value={flock.id}>
                      {flock.batchCode} ({flock.breed})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.startDate.toISOString().split('T')[0]}
                onChange={(e) => setDateRange({ 
                  ...dateRange, 
                  startDate: e.target.value ? new Date(e.target.value) : new Date()
                })}
              />
            </div>

            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.endDate.toISOString().split('T')[0]}
                onChange={(e) => setDateRange({ 
                  ...dateRange, 
                  endDate: e.target.value ? new Date(e.target.value) : new Date()
                })}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={() => handleExport('csv')} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => handleExport('pdf')} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                   <div className="text-2xl font-bold text-green-600">
                     {new Intl.NumberFormat("en-ET", {
                       style: "currency",
                       currency: "ETB",
                     }).format(totalRevenue)}
                   </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                   <div className="text-2xl font-bold text-red-600">
                     {new Intl.NumberFormat("en-ET", {
                       style: "currency",
                       currency: "ETB",
                     }).format(totalExpenses)}
                   </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                   <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                     {new Intl.NumberFormat("en-ET", {
                       style: "currency",
                       currency: "ETB",
                     }).format(totalProfit)}
                   </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="flocks" className="space-y-4">
          <TabsList>
          <TabsTrigger value="flocks">Per-Flock Analysis</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Trends</TabsTrigger>
          <TabsTrigger value="summary">Summary Charts</TabsTrigger>
          </TabsList>

        <TabsContent value="flocks" className="space-y-4">
            <Card>
              <CardHeader>
              <CardTitle>Per-Flock Financial Performance</CardTitle>
              <CardDescription>
                Detailed financial breakdown for each flock
              </CardDescription>
              </CardHeader>
              <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-muted-foreground">Loading...</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {flockFinancials.map((flock) => (
                    <Card key={flock.flockId} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">{flock.batchCode}</h3>
                          <p className="text-sm text-muted-foreground">
                            {flock.breed} • {new Date(flock.startDate).toLocaleDateString()} - {flock.endDate ? new Date(flock.endDate).toLocaleDateString() : 'Ongoing'}
                          </p>
                        </div>
                        <Badge variant={flock.netProfit >= 0 ? "default" : "destructive"}>
                          {flock.netProfit >= 0 ? "Profitable" : "Loss"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Revenue</p>
                          <p className="font-semibold text-green-600">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(flock.totalRevenue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Expenses</p>
                          <p className="font-semibold text-red-600">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(flock.totalExpenses)}
                          </p>
                    </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Net Profit</p>
                          <p className={`font-semibold ${flock.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(flock.netProfit)}
                          </p>
                </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Profit Margin</p>
                          <p className={`font-semibold ${flock.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {flock.profitMargin.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Financial Trends</CardTitle>
              <CardDescription>
                Revenue and expense trends over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-muted-foreground">Loading...</div>
                </div>
              ) : (
              <div className="space-y-4">
                  {monthlyData.map((month) => (
                    <div key={`${month.year}-${month.month}`} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">
                          {new Date(month.year, parseInt(month.month) - 1).toLocaleDateString('en-US', { 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </h3>
                    </div>
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="font-semibold text-green-600">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(month.revenue)}
                        </p>
                      </div>
                        <div>
                        <p className="text-sm text-muted-foreground">Expenses</p>
                        <p className="font-semibold text-red-600">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(month.expenses)}
                        </p>
                      </div>
                        <div>
                        <p className="text-sm text-muted-foreground">Profit</p>
                        <p className={`font-semibold ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(month.profit)}
                        </p>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Expenses</CardTitle>
                <CardDescription>Visual comparison of revenue and expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Revenue</span>
                    <span className="text-sm font-medium">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(totalRevenue)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Expenses</span>
                    <span className="text-sm font-medium">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(totalExpenses)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ width: totalRevenue > 0 ? `${(totalExpenses / totalRevenue) * 100}%` : '0%' }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

          <Card>
            <CardHeader>
                <CardTitle>Profitability Overview</CardTitle>
                <CardDescription>Key financial metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Revenue</span>
                    <span className="font-semibold text-green-600">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(totalRevenue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Expenses</span>
                    <span className="font-semibold text-red-600">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(totalExpenses)}
                    </span>
                      </div>
                  <div className="border-t pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Net Profit</span>
                      <span className={`font-bold text-lg ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(totalProfit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Profit Margin</span>
                      <span className={`font-semibold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profitMargin.toFixed(1)}%
                      </span>
                    </div>
                  </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
