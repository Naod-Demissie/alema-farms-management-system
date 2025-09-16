"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Plus, Filter, Download, BarChart3, TrendingUp, Egg } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ProductionFormData, EGG_GRADES, FERTILITY_OPTIONS } from "./production-types";
import { ProductionAnalytics } from "./production-analytics";
import { ProductionTable } from "./production-table";
import { ProductionForm } from "./production-form";

interface Flock {
  id: string;
  batchCode: string;
  breed: string;
  currentCount: number;
}

interface ProductionManagementProps {
  flocks: Flock[];
  onProductionCreated?: () => void;
  onProductionUpdated?: () => void;
  onProductionDeleted?: () => void;
}

export function ProductionManagement({
  flocks,
  onProductionCreated,
  onProductionUpdated,
  onProductionDeleted
}: ProductionManagementProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [filters, setFilters] = useState({
    search: "",
    flockId: "",
    grade: "",
    fertility: "",
    dateRange: {
      start: new Date(new Date().setDate(new Date().getDate() - 30)),
      end: new Date()
    }
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === "all" ? "" : value
    }));
  };

  const handleProductionCreated = () => {
    setIsFormOpen(false);
    onProductionCreated?.();
  };

  const handleProductionUpdated = () => {
    onProductionUpdated?.();
  };

  const handleProductionDeleted = () => {
    onProductionDeleted?.();
  };

  const getTotalProduction = () => {
    // This would be calculated from actual data
    return 0;
  };

  const getTodayProduction = () => {
    // This would be calculated from actual data
    return 0;
  };

  const getQualityScore = () => {
    // This would be calculated from actual data
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Management</h1>
          <p className="text-muted-foreground">
            Track daily egg production and quality control
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Production
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Egg Production</DialogTitle>
                <DialogDescription>
                  Record daily egg collection with quantity and quality grading
                </DialogDescription>
              </DialogHeader>
              <ProductionForm
                flocks={flocks}
                onSuccess={handleProductionCreated}
                onCancel={() => setIsFormOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Production</CardTitle>
            <Egg className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalProduction().toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Production</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTodayProduction().toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +5% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getQualityScore()}%</div>
            <p className="text-xs text-muted-foreground">
              Average quality rating
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Flocks</CardTitle>
            <Badge variant="secondary">{flocks.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {flocks.reduce((sum, flock) => sum + flock.currentCount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total birds in production
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search flocks..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="flock">Flock</Label>
              <Select
                value={filters.flockId}
                onValueChange={(value) => handleFilterChange("flockId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All flocks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All flocks</SelectItem>
                  {flocks.map((flock) => (
                    <SelectItem key={flock.id} value={flock.id}>
                      {flock.batchCode} ({flock.breed})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <Select
                value={filters.grade}
                onValueChange={(value) => handleFilterChange("grade", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All grades</SelectItem>
                  {EGG_GRADES.map((grade) => (
                    <SelectItem key={grade.value} value={grade.value}>
                      {grade.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fertility">Fertility</Label>
              <Select
                value={filters.fertility}
                onValueChange={(value) => handleFilterChange("fertility", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All fertility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All fertility</SelectItem>
                  {FERTILITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange ? (
                      `${format(filters.dateRange.start, "MMM dd")} - ${format(filters.dateRange.end, "MMM dd")}`
                    ) : (
                      "Pick a date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={filters.dateRange}
                    onSelect={(range) => handleFilterChange("dateRange", range)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="records">Production Records</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ProductionAnalytics
            filters={filters}
            flocks={flocks}
          />
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <ProductionTable
            filters={filters}
            onProductionUpdated={handleProductionUpdated}
            onProductionDeleted={handleProductionDeleted}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
            <p className="text-muted-foreground">
              Detailed production analytics and reporting coming soon
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
