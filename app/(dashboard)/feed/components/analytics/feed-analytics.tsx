"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getFeedConversionRatio, getFeedEfficiencyStats } from "../../server/feed-analytics";
import { Activity, TrendingDown, TrendingUp, Wheat } from "lucide-react";
import { useTranslations } from "next-intl";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Line, LineChart } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type StatsData = {
  monthlyFCR: number;
  feedUsed: number;
  eggsProduced: number;
  activeFlocks: number;
  avgFeedPerBirdPerDay: number;
  birds: number;
};

type FCRData = {
  totalFeedUsed: number;
  totalEggs: number;
  totalBroilers: number;
  eggMassKg: number;
  broilerMassKg: number;
  totalProductionMass: number;
  fcr: number;
  perFlockData: Array<{
    flockId: string;
    batchCode: string;
    feedUsed: number;
    eggCount: number;
    broilerCount: number;
    productionMass: number;
    fcr: number;
  }>;
  trendData: Array<{
    date: string;
    feedUsed: number;
    production: number;
    fcr: number;
  }>;
};

export function FeedAnalytics() {
  const t = useTranslations("feed.analytics");
  const tCommon = useTranslations("common");
  const [selectedFlock, setSelectedFlock] = useState<string>("all");
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [fcrData, setFCRData] = useState<FCRData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [fcrLoading, setFCRLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const result = await getFeedEfficiencyStats();
        if (result.success && result.data) {
          setStatsData(result.data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const fetchFCR = async () => {
      setFCRLoading(true);
      try {
        const result = await getFeedConversionRatio(
          selectedFlock === "all" ? undefined : selectedFlock
        );
        if (result.success && result.data) {
          setFCRData(result.data);
        }
      } catch (error) {
        console.error("Error fetching FCR:", error);
      } finally {
        setFCRLoading(false);
      }
    };

    fetchFCR();
  }, [selectedFlock]);

  const formatFCR = (fcr: number) => {
    return fcr.toFixed(2);
  };

  const getFCRStatus = (fcr: number) => {
    // Good FCR for layers: 2.0-2.5 (kg feed per kg of eggs)
    // Good FCR for broilers: 1.5-2.0 (kg feed per kg of meat)
    if (fcr <= 2.0) return { label: t("excellent"), variant: "success" as const };
    if (fcr <= 2.5) return { label: t("good"), variant: "default" as const };
    if (fcr <= 3.0) return { label: t("average"), variant: "secondary" as const };
    return { label: t("poor"), variant: "destructive" as const };
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("monthlyFCR")}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatFCR(statsData?.monthlyFCR || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {getFCRStatus(statsData?.monthlyFCR || 0).label}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalFeedUsed")}
            </CardTitle>
            <Wheat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(statsData?.feedUsed || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("kgThisMonth")}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("eggsProduced")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(statsData?.eggsProduced || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("eggsThisMonth")}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("avgFeedPerBird")}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(statsData?.avgFeedPerBirdPerDay || 0).toFixed(3)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("kgPerDay")}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FCR Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t("fcrTrend")}</CardTitle>
          <CardDescription>{t("fcrTrendDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {fcrLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ChartContainer
              config={{
                fcr: {
                  label: t("fcr"),
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fcrData?.trendData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="fcr"
                    stroke="var(--color-fcr)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Per-Flock FCR Table */}
      {selectedFlock === "all" && fcrData?.perFlockData && fcrData.perFlockData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("perFlockFCR")}</CardTitle>
            <CardDescription>{t("perFlockDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("batchCode")}</TableHead>
                  <TableHead className="text-right">{t("feedUsed")}</TableHead>
                  <TableHead className="text-right">{t("eggsProduced")}</TableHead>
                  <TableHead className="text-right">{t("productionMass")}</TableHead>
                  <TableHead className="text-right">{t("fcr")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fcrData.perFlockData
                  .filter((flock) => flock.feedUsed > 0 || flock.eggCount > 0)
                  .map((flock) => {
                    const status = getFCRStatus(flock.fcr);
                    return (
                      <TableRow key={flock.flockId}>
                        <TableCell className="font-medium">{flock.batchCode}</TableCell>
                        <TableCell className="text-right">
                          {flock.feedUsed.toFixed(2)} kg
                        </TableCell>
                        <TableCell className="text-right">
                          {flock.eggCount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {flock.productionMass.toFixed(2)} kg
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatFCR(flock.fcr)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>{t("summary")}</CardTitle>
          <CardDescription>{t("summaryDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {fcrLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("totalFeedConsumed")}</p>
                <p className="text-2xl font-bold">{fcrData?.totalFeedUsed.toFixed(2)} kg</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("totalEggMass")}</p>
                <p className="text-2xl font-bold">{fcrData?.eggMassKg.toFixed(2)} kg</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("overallFCR")}</p>
                <p className="text-2xl font-bold">{formatFCR(fcrData?.fcr || 0)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
