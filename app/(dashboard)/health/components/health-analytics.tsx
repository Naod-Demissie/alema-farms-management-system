"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Syringe,
  Skull,
  Heart,
  Calendar,
  Download,
  Filter
} from "lucide-react";

// Mock data for analytics
const mockAnalytics = {
  vaccinationTrends: [
    { month: "Jan", completed: 45, scheduled: 12, inProgress: 3 },
    { month: "Feb", completed: 52, scheduled: 8, inProgress: 5 },
    { month: "Mar", completed: 48, scheduled: 15, inProgress: 2 },
    { month: "Apr", completed: 61, scheduled: 6, inProgress: 4 },
    { month: "May", completed: 58, scheduled: 10, inProgress: 3 },
    { month: "Jun", completed: 67, scheduled: 4, inProgress: 6 }
  ],
  diseaseDistribution: [
    { disease: "Respiratory", count: 12, percentage: 35 },
    { disease: "Digestive", count: 8, percentage: 23 },
    { disease: "Parasitic", count: 6, percentage: 18 },
    { disease: "Nutritional", count: 4, percentage: 12 },
    { disease: "Other", count: 4, percentage: 12 }
  ],
  mortalityTrends: [
    { month: "Jan", deaths: 8, rate: 2.1 },
    { month: "Feb", deaths: 6, rate: 1.8 },
    { month: "Mar", deaths: 12, rate: 3.2 },
    { month: "Apr", deaths: 7, rate: 2.0 },
    { month: "May", deaths: 5, rate: 1.5 },
    { month: "Jun", deaths: 9, rate: 2.4 }
  ],
  healthMetrics: {
    avgWeight: 2.1,
    weightTrend: 0.2,
    mortalityRate: 2.3,
    mortalityTrend: -0.3,
    vaccinationCoverage: 94.5,
    vaccinationTrend: 2.1,
    treatmentSuccess: 87.2,
    treatmentTrend: 3.4
  },
  flockHealthStatus: [
    { flockId: "Flock A-001", healthScore: 95, status: "excellent", issues: 0 },
    { flockId: "Flock B-002", healthScore: 78, status: "good", issues: 2 },
    { flockId: "Flock C-003", healthScore: 92, status: "excellent", issues: 0 },
    { flockId: "Flock D-004", healthScore: 65, status: "fair", issues: 4 }
  ]
};

export function HealthAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  const [selectedFlock, setSelectedFlock] = useState("all");

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-yellow-600";
    if (score >= 70) return "text-orange-600";
    return "text-red-600";
  };

  const getHealthScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 80) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    if (score >= 70) return <Badge className="bg-orange-100 text-orange-800">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Health Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive health insights and trend analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedFlock} onValueChange={setSelectedFlock}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Flocks</SelectItem>
              <SelectItem value="Flock A-001">Flock A-001</SelectItem>
              <SelectItem value="Flock B-002">Flock B-002</SelectItem>
              <SelectItem value="Flock C-003">Flock C-003</SelectItem>
              <SelectItem value="Flock D-004">Flock D-004</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Weight</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.healthMetrics.avgWeight} kg</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{mockAnalytics.healthMetrics.weightTrend}kg</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mortality Rate</CardTitle>
            <Skull className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.healthMetrics.mortalityRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{mockAnalytics.healthMetrics.mortalityTrend}%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vaccination Coverage</CardTitle>
            <Syringe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.healthMetrics.vaccinationCoverage}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{mockAnalytics.healthMetrics.vaccinationTrend}%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treatment Success</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.healthMetrics.treatmentSuccess}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{mockAnalytics.healthMetrics.treatmentTrend}%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vaccinations">Vaccinations</TabsTrigger>
          <TabsTrigger value="diseases">Diseases</TabsTrigger>
          <TabsTrigger value="mortality">Mortality</TabsTrigger>
          <TabsTrigger value="flocks">Flock Health</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Vaccination Trends</CardTitle>
                <CardDescription>Monthly vaccination completion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAnalytics.vaccinationTrends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="text-sm font-medium">{trend.month}</div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-muted-foreground">{trend.completed} completed</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm text-muted-foreground">{trend.scheduled} scheduled</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-muted-foreground">{trend.inProgress} in progress</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Disease Distribution</CardTitle>
                <CardDescription>Breakdown of disease cases by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAnalytics.diseaseDistribution.map((disease, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="text-sm font-medium">{disease.disease}</div>
                      <div className="flex items-center space-x-4">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${disease.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {disease.count} ({disease.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vaccinations Tab */}
        <TabsContent value="vaccinations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vaccination Performance</CardTitle>
              <CardDescription>Detailed vaccination analytics and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">94.5%</div>
                    <div className="text-sm text-muted-foreground">Coverage Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">1,247</div>
                    <div className="text-sm text-muted-foreground">Total Vaccinations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">23</div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Vaccine Types Performance</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Newcastle Disease</span>
                      </div>
                      <div className="text-sm text-muted-foreground">98% success rate</div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Marek's Disease</span>
                      </div>
                      <div className="text-sm text-muted-foreground">96% success rate</div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium">IBD Vaccine</span>
                      </div>
                      <div className="text-sm text-muted-foreground">89% success rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Diseases Tab */}
        <TabsContent value="diseases" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Disease Analysis</CardTitle>
              <CardDescription>Disease patterns and treatment effectiveness</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-4">Most Common Diseases</h4>
                    <div className="space-y-3">
                      {mockAnalytics.diseaseDistribution.map((disease, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm">{disease.disease}</span>
                          </div>
                          <div className="text-sm font-medium">{disease.count} cases</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-4">Treatment Success by Disease</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Respiratory</span>
                        <Badge className="bg-green-100 text-green-800">92%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Digestive</span>
                        <Badge className="bg-yellow-100 text-yellow-800">78%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Parasitic</span>
                        <Badge className="bg-green-100 text-green-800">95%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Nutritional</span>
                        <Badge className="bg-green-100 text-green-800">88%</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mortality Tab */}
        <TabsContent value="mortality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mortality Analysis</CardTitle>
              <CardDescription>Mortality trends and cause analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-4">Monthly Mortality Trends</h4>
                    <div className="space-y-3">
                      {mockAnalytics.mortalityTrends.map((trend, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="text-sm font-medium">{trend.month}</div>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-muted-foreground">{trend.deaths} deaths</span>
                            <Badge variant={trend.rate > 2.5 ? "destructive" : trend.rate > 2.0 ? "outline" : "default"}>
                              {trend.rate}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-4">Mortality by Cause</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Disease</span>
                        <Badge className="bg-red-100 text-red-800">45%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Environmental</span>
                        <Badge className="bg-orange-100 text-orange-800">25%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Injury</span>
                        <Badge className="bg-yellow-100 text-yellow-800">20%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Unknown</span>
                        <Badge className="bg-gray-100 text-gray-800">10%</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flock Health Tab */}
        <TabsContent value="flocks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Flock Health Status</CardTitle>
              <CardDescription>Individual flock health scores and issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAnalytics.flockHealthStatus.map((flock, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="font-mono font-medium">{flock.flockId}</div>
                      <div className={`text-2xl font-bold ${getHealthScoreColor(flock.healthScore)}`}>
                        {flock.healthScore}
                      </div>
                      <div className="text-sm text-muted-foreground">health score</div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {getHealthScoreBadge(flock.healthScore)}
                      <div className="text-sm text-muted-foreground">
                        {flock.issues} {flock.issues === 1 ? 'issue' : 'issues'}
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
