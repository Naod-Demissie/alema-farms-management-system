"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getHealthAnalytics } from "../../server/health-analytics";
import { Activity, Heart, Skull, AlertTriangle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

type FlockAnalytics = {
  flockId: string;
  batchCode: string;
  initialCount: number;
  currentCount: number;
  ageInDays: number;
  totalDeaths: number;
  totalDeathsAllTime: number;
  totalTreatments: number;
  activeTreatments: number;
  mortalityRate: number;
  morbidityRate: number;
  healthyPercentage: number;
};

type OverallStats = {
  totalBirds: number;
  totalDeaths: number;
  totalActiveTreatments: number;
  totalTreatments: number;
  mortalityRate: number;
  morbidityRate: number;
  healthyRate: number;
  activeFlocks: number;
};

type HealthData = {
  flockAnalytics: FlockAnalytics[];
  overallStats: OverallStats;
  mortalityByCause: Array<{ cause: string; count: number }>;
  diseaseDistribution: Array<{ disease: string; count: number }>;
};

export function HealthAnalytics() {
  const t = useTranslations("health.analytics");
  const tCommon = useTranslations("common");
  const tDiseaseClass = useTranslations("enums.diseaseClass");
  const tDeathCause = useTranslations("enums.deathCause");
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getHealthAnalytics();
      if (result.success && result.data) {
        setHealthData(result.data);
        console.log('✅ Health analytics data loaded successfully:', result.data);
      } else {
        console.error('❌ Health analytics failed:', result.error);
      }
    } catch (error) {
      console.error("Error fetching health analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  const getHealthStatus = (healthyPercentage: number) => {
    if (healthyPercentage >= 95) return { label: t("excellent"), variant: "default" as const, color: "bg-green-500" };
    if (healthyPercentage >= 85) return { label: t("good"), variant: "default" as const, color: "bg-blue-500" };
    if (healthyPercentage >= 75) return { label: t("fair"), variant: "secondary" as const, color: "bg-yellow-500" };
    return { label: t("poor"), variant: "destructive" as const, color: "bg-red-500" };
  };

  const formatRate = (rate: number) => {
    return rate.toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* Overall Health Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalBirds")}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
           <CardContent>
             {loading ? (
               <div className="text-2xl font-bold">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
               </div>
             ) : (
               <>
                 <div className="text-2xl font-bold">
                   {healthData?.overallStats.totalBirds.toLocaleString() || 0}
                 </div>
                 <p className="text-xs text-muted-foreground">
                   {t("totalBirds")}
                 </p>
               </>
             )}
           </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("mortalityRate")}
            </CardTitle>
            <Skull className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
           <CardContent>
             {loading ? (
               <div className="text-2xl font-bold">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
               </div>
             ) : (
               <>
                 <div className="text-2xl font-bold text-red-600">
                   {formatRate(healthData?.overallStats.mortalityRate || 0)}%
                 </div>
                 <p className="text-xs text-muted-foreground">
                   {t("mortalityRate")}
                 </p>
               </>
             )}
           </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("morbidityRate")}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
           <CardContent>
             {loading ? (
               <div className="text-2xl font-bold">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
               </div>
             ) : (
               <>
                 <div className="text-2xl font-bold text-orange-600">
                   {formatRate(healthData?.overallStats.morbidityRate || 0)}%
                 </div>
                 <p className="text-xs text-muted-foreground">
                   {t("morbidityRate")}
                 </p>
               </>
             )}
           </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("healthyRate")}
            </CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
           <CardContent>
             {loading ? (
               <div className="text-2xl font-bold">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
               </div>
             ) : (
               <>
                 <div className="text-2xl font-bold text-green-600">
                   {formatRate(healthData?.overallStats.healthyRate || 0)}%
                 </div>
                 <p className="text-xs text-muted-foreground">
                   {t("healthyRate")}
                 </p>
               </>
             )}
           </CardContent>
        </Card>
      </div>

      {/* Per-Flock Analytics Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("perFlockAnalytics")}</CardTitle>
              <CardDescription>{t("perFlockDescription")}</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
         <CardContent>
           {loading ? (
             <div className="flex items-center justify-center py-8">
               <div className="text-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                 <p className="mt-2 text-sm text-muted-foreground">{t("loadingAnalytics")}</p>
               </div>
             </div>
           ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("batchCode")}</TableHead>
                    <TableHead className="text-right">{t("currentCount")}</TableHead>
                    <TableHead className="text-right">{t("deaths")}</TableHead>
                    <TableHead className="text-right">{t("mortalityRate")}</TableHead>
                    <TableHead className="text-right">{t("morbidityRate")}</TableHead>
                    <TableHead className="text-right">{t("activeTreatments")}</TableHead>
                    <TableHead className="text-right">{t("healthStatus")}</TableHead>
                    <TableHead className="text-right">{t("healthyPercentage")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {healthData?.flockAnalytics && healthData.flockAnalytics.length > 0 ? (
                    healthData.flockAnalytics.map((flock) => {
                      const status = getHealthStatus(flock.healthyPercentage);
                      return (
                        <TableRow key={flock.flockId}>
                          <TableCell className="font-medium">{flock.batchCode}</TableCell>
                          <TableCell className="text-right">{flock.currentCount}</TableCell>
                          <TableCell className="text-right">{flock.totalDeathsAllTime}</TableCell>
                          <TableCell className="text-right">
                            <span className="font-semibold text-red-600">
                              {formatRate(flock.mortalityRate)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-semibold text-orange-600">
                              {formatRate(flock.morbidityRate)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {flock.activeTreatments > 0 ? (
                              <Badge variant="destructive">{flock.activeTreatments}</Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-semibold text-green-600">
                                {formatRate(flock.healthyPercentage)}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        {t("noData")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mortality by Cause & Disease Distribution */}
      <div className="grid gap-4 sm:grid-cols-2">
         <Card>
           <CardHeader>
             <CardTitle>{t("mortalityByCause")}</CardTitle>
             <CardDescription>{t("mortalityByCauseDescription")}</CardDescription>
           </CardHeader>
           <CardContent>
             {loading ? (
               <div className="flex items-center justify-center py-8">
                 <div className="text-center">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                   <p className="mt-2 text-sm text-muted-foreground">{t("loadingMortality")}</p>
                 </div>
               </div>
             ) : (
              <div className="space-y-4">
                {healthData?.mortalityByCause && healthData.mortalityByCause.length > 0 ? (
                  healthData.mortalityByCause.map((item) => (
                    <div key={item.cause} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {tDeathCause(item.cause as any)}
                        </span>
                        <span className={`text-sm font-bold ${item.count === 0 ? 'text-muted-foreground' : ''}`}>
                          {item.count}
                        </span>
                      </div>
                      <Progress
                        value={item.count === 0 ? 0 : (item.count / (healthData?.overallStats.totalDeaths || 1)) * 100}
                        className={`h-2 ${item.count === 0 ? 'opacity-50' : ''}`}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">{t("noData")}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

         <Card>
           <CardHeader>
             <CardTitle>{t("diseaseDistribution")}</CardTitle>
             <CardDescription>{t("diseaseDistributionDescription")}</CardDescription>
           </CardHeader>
           <CardContent>
             {loading ? (
               <div className="flex items-center justify-center py-8">
                 <div className="text-center">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                   <p className="mt-2 text-sm text-muted-foreground">{t("loadingDisease")}</p>
                 </div>
               </div>
             ) : (
              <div className="space-y-4">
                {healthData?.diseaseDistribution && healthData.diseaseDistribution.length > 0 ? (
                  healthData.diseaseDistribution.map((item) => (
                    <div key={item.disease} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {tDiseaseClass(item.disease as any)}
                        </span>
                        <span className={`text-sm font-bold ${item.count === 0 ? 'text-muted-foreground' : ''}`}>
                          {item.count}
                        </span>
                      </div>
                      <Progress
                        value={item.count === 0 ? 0 : (item.count / (healthData?.overallStats.totalTreatments || 1)) * 100}
                        className={`h-2 ${item.count === 0 ? 'opacity-50' : ''}`}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">{t("noData")}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

