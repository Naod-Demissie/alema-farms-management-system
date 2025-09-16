"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Plus,
  RefreshCw,
  Loader2,
  BarChart3,
  Users,
  Calendar,
  MapPin
} from "lucide-react";
import { FlockManagement } from "./components/flock-management";
import { FlockAnalytics } from "./components/flock-analytics";
import { FlockPopulationManagement } from "./components/flock-population-management";
import { FlockStatistics } from "./components/flock-statistics";
import { 
  createFlock, 
  getFlocks, 
  getFlockStatistics,
  FlockFilters,
  PaginationParams,
  SortParams
} from "@/server/flocks";
import { Flock } from "./components/flock-types";
import { format } from "date-fns";

export default function FlocksPage() {
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("management");

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [flocksResult, statsResult] = await Promise.all([
        getFlocks({}, { page: 1, limit: 50 }, { field: 'createdAt', direction: 'desc' }),
        getFlockStatistics()
      ]);

      if (flocksResult.success) {
        setFlocks(flocksResult.data || []);
      }

      if (statsResult.success) {
        setStatistics(statsResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleFlockCreated = (newFlock: Flock) => {
    setFlocks(prev => [newFlock, ...prev]);
    loadData(); // Refresh statistics
  };

  const handleFlockUpdated = (updatedFlock: Flock) => {
    setFlocks(prev => 
      prev.map(flock => 
        flock.id === updatedFlock.id ? updatedFlock : flock
      )
    );
    loadData(); // Refresh statistics
  };

  const handleFlockDeleted = (flockId: string) => {
    setFlocks(prev => prev.filter(flock => flock.id !== flockId));
    loadData(); // Refresh statistics
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading flocks...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flock Management</h1>
          <p className="text-muted-foreground">
            Manage your poultry flocks, track populations, and monitor performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
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
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.averageMortalityRate}%</div>
              <p className="text-xs text-muted-foreground">
                Across all flocks
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="management">Flock Management</TabsTrigger>
          <TabsTrigger value="population">Population Tracking</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="management" className="space-y-4">
          <FlockManagement
            flocks={flocks}
            onFlockCreated={handleFlockCreated}
            onFlockUpdated={handleFlockUpdated}
            onFlockDeleted={handleFlockDeleted}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="population" className="space-y-4">
          <FlockPopulationManagement
            flocks={flocks}
            onFlockUpdated={handleFlockUpdated}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <FlockAnalytics
            flocks={flocks}
            statistics={statistics}
          />
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <FlockStatistics
            statistics={statistics}
            flocks={flocks}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
