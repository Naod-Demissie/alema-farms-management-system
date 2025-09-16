"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Heart, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  Skull,
  Syringe,
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

interface HealthReportsProps {
  filters: ReportFilters;
}

interface HealthData {
  totalDeaths: number;
  averageMortalityRate: number;
  vaccinationCoverage: number;
  treatmentSuccessRate: number;
  diseaseDistribution: Array<{
    disease: string;
    count: number;
    percentage: number;
  }>;
  mortalityByCause: Array<{
    cause: string;
    count: number;
    percentage: number;
  }>;
  vaccinationTrends: Array<{
    month: string;
    completed: number;
    scheduled: number;
    inProgress: number;
  }>;
  treatmentTrends: Array<{
    month: string;
    treatments: number;
    successRate: number;
  }>;
  flockHealthStatus: Array<{
    flockId: string;
    flockCode: string;
    healthScore: number;
    mortalityRate: number;
    vaccinationStatus: string;
    lastTreatment: string;
  }>;
  monthlyMortality: Array<{
    month: string;
    deaths: number;
    rate: number;
  }>;
}

export function HealthReports({ filters }: HealthReportsProps) {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchHealthData();
  }, [filters]);

  const fetchHealthData = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockData: HealthData = {
        totalDeaths: 156,
        averageMortalityRate: 2.3,
        vaccinationCoverage: 94.5,
        treatmentSuccessRate: 87.2,
        diseaseDistribution: [
          { disease: "Respiratory", count: 12, percentage: 35 },
          { disease: "Digestive", count: 8, percentage: 23 },
          { disease: "Parasitic", count: 6, percentage: 18 },
          { disease: "Nutritional", count: 4, percentage: 12 },
          { disease: "Other", count: 4, percentage: 12 }
        ],
        mortalityByCause: [
          { cause: "disease", count: 89, percentage: 57.1 },
          { cause: "injury", count: 34, percentage: 21.8 },
          { cause: "environmental", count: 23, percentage: 14.7 },
          { cause: "unknown", count: 10, percentage: 6.4 }
        ],
        vaccinationTrends: [
          { month: "Jan", completed: 45, scheduled: 12, inProgress: 3 },
          { month: "Feb", completed: 52, scheduled: 8, inProgress: 5 },
          { month: "Mar", completed: 48, scheduled: 15, inProgress: 2 },
          { month: "Apr", completed: 61, scheduled: 6, inProgress: 4 },
          { month: "May", completed: 58, scheduled: 10, inProgress: 3 },
          { month: "Jun", completed: 67, scheduled: 4, inProgress: 6 }
        ],
        treatmentTrends: [
          { month: "Jan", treatments: 15, successRate: 85 },
          { month: "Feb", treatments: 12, successRate: 88 },
          { month: "Mar", treatments: 18, successRate: 82 },
          { month: "Apr", treatments: 14, successRate: 90 },
          { month: "May", treatments: 16, successRate: 87 },
          { month: "Jun", treatments: 13, successRate: 89 }
        ],
        flockHealthStatus: [
          { flockId: "1", flockCode: "A-001", healthScore: 95, mortalityRate: 2.1, vaccinationStatus: "Complete", lastTreatment: "2024-01-15" },
          { flockId: "2", flockCode: "B-002", healthScore: 78, mortalityRate: 4.2, vaccinationStatus: "In Progress", lastTreatment: "2024-01-20" },
          { flockId: "3", flockCode: "C-003", healthScore: 65, mortalityRate: 6.8, vaccinationStatus: "Pending", lastTreatment: "2024-01-10" }
        ],
        monthlyMortality: [
          { month: "Jan", deaths: 8, rate: 2.1 },
          { month: "Feb", deaths: 6, rate: 1.8 },
          { month: "Mar", deaths: 12, rate: 3.2 },
          { month: "Apr", deaths: 7, rate: 2.0 },
          { month: "May", deaths: 5, rate: 1.5 },
          { month: "Jun", deaths: 9, rate: 2.4 }
        ]
      };
      
      setData(mockData);
    } catch (error) {
      console.error("Error fetching health data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    console.log(`Exporting health report as ${format}`);
    // Implement export logic
  };

  const getDiseaseColor = (disease: string) => {
    switch (disease) {
      case 'Respiratory': return 'bg-red-500';
      case 'Digestive': return 'bg-orange-500';
      case 'Parasitic': return 'bg-yellow-500';
      case 'Nutritional': return 'bg-blue-500';
      case 'Other': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getCauseColor = (cause: string) => {
    switch (cause) {
      case 'disease': return 'bg-red-500';
      case 'injury': return 'bg-orange-500';
      case 'environmental': return 'bg-yellow-500';
      case 'unknown': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthStatusColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getVaccinationStatusColor = (status: string) => {
    switch (status) {
      case 'Complete': return 'text-green-600 bg-green-100';
      case 'In Progress': return 'text-yellow-600 bg-yellow-100';
      case 'Pending': return 'text-red-600 bg-red-100';
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
        <p className="text-muted-foreground">No health data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deaths</CardTitle>
            <Skull className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data.totalDeaths}
            </div>
            <p className="text-xs text-muted-foreground">
              Deaths recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mortality Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.averageMortalityRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average across flocks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vaccination Coverage</CardTitle>
            <Syringe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.vaccinationCoverage}%
            </div>
            <p className="text-xs text-muted-foreground">
              Flocks vaccinated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treatment Success</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.treatmentSuccessRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Successful treatments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="mortality">Mortality Analysis</TabsTrigger>
            <TabsTrigger value="diseases">Disease Analysis</TabsTrigger>
            <TabsTrigger value="vaccinations">Vaccinations</TabsTrigger>
            <TabsTrigger value="treatments">Treatments</TabsTrigger>
            <TabsTrigger value="flocks">Flock Health</TabsTrigger>
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
                  Disease Distribution
                </CardTitle>
                <CardDescription>Distribution of diseases by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.diseaseDistribution.map((disease) => (
                    <div key={disease.disease} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getDiseaseColor(disease.disease)}`} />
                          <span className="font-medium">{disease.disease}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{disease.count}</div>
                          <div className="text-sm text-muted-foreground">
                            {disease.percentage}%
                          </div>
                        </div>
                      </div>
                      <Progress value={disease.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Mortality by Cause
                </CardTitle>
                <CardDescription>Distribution of deaths by cause</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.mortalityByCause.map((cause) => (
                    <div key={cause.cause} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getCauseColor(cause.cause)}`} />
                          <span className="font-medium capitalize">{cause.cause}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{cause.count}</div>
                          <div className="text-sm text-muted-foreground">
                            {cause.percentage}%
                          </div>
                        </div>
                      </div>
                      <Progress value={cause.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Mortality Analysis Tab */}
        <TabsContent value="mortality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mortality Analysis</CardTitle>
              <CardDescription>Detailed mortality trends and patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.monthlyMortality.map((month) => (
                  <div key={month.month} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{month.month}</h3>
                      <Badge variant={month.rate <= 3 ? "default" : "destructive"}>
                        {month.rate}% rate
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Total deaths: {month.deaths}</span>
                      <span>Mortality rate: {month.rate}%</span>
                    </div>
                    <Progress 
                      value={Math.min(month.rate * 10, 100)} 
                      className="mt-2" 
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Disease Analysis Tab */}
        <TabsContent value="diseases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Disease Analysis</CardTitle>
              <CardDescription>Detailed breakdown of diseases and treatments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data.diseaseDistribution.map((disease) => (
                  <div key={disease.disease} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{disease.disease}</h3>
                      <Badge variant="outline">
                        {disease.count} cases
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                      <span>Percentage of total cases</span>
                      <span>{disease.percentage}%</span>
                    </div>
                    <Progress value={disease.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vaccinations Tab */}
        <TabsContent value="vaccinations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vaccination Trends</CardTitle>
              <CardDescription>Monthly vaccination progress and coverage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.vaccinationTrends.map((month) => (
                  <div key={month.month} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{month.month}</h3>
                      <Badge variant="outline">
                        {month.completed} completed
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Completed</div>
                        <div className="font-medium text-green-600">{month.completed}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Scheduled</div>
                        <div className="font-medium text-blue-600">{month.scheduled}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">In Progress</div>
                        <div className="font-medium text-yellow-600">{month.inProgress}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Treatments Tab */}
        <TabsContent value="treatments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Treatment Trends</CardTitle>
              <CardDescription>Monthly treatment statistics and success rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.treatmentTrends.map((month) => (
                  <div key={month.month} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{month.month}</h3>
                      <Badge variant={month.successRate >= 85 ? "default" : "secondary"}>
                        {month.successRate}% success
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Total Treatments</div>
                        <div className="font-medium">{month.treatments}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Success Rate</div>
                        <div className="font-medium">{month.successRate}%</div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Success Rate</span>
                        <span>{month.successRate}%</span>
                      </div>
                      <Progress value={month.successRate} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flock Health Tab */}
        <TabsContent value="flocks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Flock Health Status</CardTitle>
              <CardDescription>Health metrics and status for each flock</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.flockHealthStatus.map((flock) => (
                  <div key={flock.flockId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{flock.flockCode}</h3>
                        <p className="text-sm text-muted-foreground">
                          Flock ID: {flock.flockId}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getHealthStatusColor(flock.healthScore)}>
                          {flock.healthScore}% health
                        </Badge>
                        <Badge className={getVaccinationStatusColor(flock.vaccinationStatus)}>
                          {flock.vaccinationStatus}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Health Score</div>
                        <div className="font-medium">{flock.healthScore}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Mortality Rate</div>
                        <div className="font-medium">{flock.mortalityRate}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Last Treatment</div>
                        <div className="font-medium text-xs">
                          {new Date(flock.lastTreatment).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Health Score</span>
                        <span>{flock.healthScore}%</span>
                      </div>
                      <Progress value={flock.healthScore} className="h-2" />
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
