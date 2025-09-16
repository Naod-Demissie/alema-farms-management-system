"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Syringe, 
  Activity, 
  Skull, 
  BarChart3, 
  Plus,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Calendar,
  Users,
  Shield
} from "lucide-react";

// Import components (we'll create these)
import { VaccinationRecords } from "./components/vaccination-records";
import { DiseaseTreatment } from "./components/disease-treatment";
import { HealthMonitoring } from "./components/health-monitoring";
import { MortalityManagement } from "./components/mortality-management";
import { HealthAnalytics } from "./components/health-analytics";

export default function HealthManagementPage() {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data for overview stats
  const healthStats = {
    totalVaccinations: 1247,
    activeTreatments: 23,
    healthAlerts: 5,
    mortalityRate: 2.3,
    avgWeight: 2.1,
    healthyFlock: 89.2
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Health & Veterinary Management</h1>
          <p className="text-muted-foreground">
            Comprehensive health monitoring, vaccination tracking, and veterinary care management
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Record
        </Button>
      </div>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vaccinations">Vaccinations</TabsTrigger>
          <TabsTrigger value="treatments">Treatments</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="mortality">Mortality</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Vaccinations</CardTitle>
                <Syringe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthStats.totalVaccinations.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+12%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Treatments</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthStats.activeTreatments}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-red-600">+3</span> new this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Health Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{healthStats.healthAlerts}</div>
                <p className="text-xs text-muted-foreground">
                  Requires immediate attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mortality Rate</CardTitle>
                <Skull className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthStats.mortalityRate}%</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">-0.3%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Weight (kg)</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthStats.avgWeight}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+0.2kg</span> from last week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Healthy Flock %</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthStats.healthyFlock}%</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+2.1%</span> from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Vaccinations</CardTitle>
                <CardDescription>Latest vaccination records</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Newcastle Disease Vaccine</p>
                    <p className="text-xs text-muted-foreground">Flock A-001 • Lot #ND2024001</p>
                  </div>
                  <Badge variant="secondary">Completed</Badge>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">IBD Vaccine</p>
                    <p className="text-xs text-muted-foreground">Flock B-002 • Lot #IBD2024002</p>
                  </div>
                  <Badge variant="outline">Scheduled</Badge>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Marek's Disease Vaccine</p>
                    <p className="text-xs text-muted-foreground">Flock C-003 • Lot #MD2024003</p>
                  </div>
                  <Badge variant="secondary">Completed</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Health Alerts</CardTitle>
                <CardDescription>Issues requiring attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Respiratory symptoms detected</p>
                    <p className="text-xs text-muted-foreground">Flock A-001 • 2 hours ago</p>
                  </div>
                  <Badge variant="destructive">High Priority</Badge>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Weight loss in Flock B-002</p>
                    <p className="text-xs text-muted-foreground">Flock B-002 • 4 hours ago</p>
                  </div>
                  <Badge variant="outline">Medium Priority</Badge>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Abnormal behavior patterns</p>
                    <p className="text-xs text-muted-foreground">Flock C-003 • 6 hours ago</p>
                  </div>
                  <Badge variant="outline">Low Priority</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vaccination Records Tab */}
        <TabsContent value="vaccinations">
          <VaccinationRecords />
        </TabsContent>

        {/* Disease Treatment Tab */}
        <TabsContent value="treatments">
          <DiseaseTreatment />
        </TabsContent>

        {/* Health Monitoring Tab */}
        <TabsContent value="monitoring">
          <HealthMonitoring />
        </TabsContent>

        {/* Mortality Management Tab */}
        <TabsContent value="mortality">
          <MortalityManagement />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <HealthAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
