"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getFeedConversionRatio, getFeedEfficiencyStats } from "../../server/feed-analytics";
import { Activity, TrendingDown, TrendingUp, Wheat, Scale } from "lucide-react";
import { useTranslations } from "next-intl";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Line, LineChart } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type StatsData = {
  monthlyFCR: number;
  feedUsed: number;
  monthlyWeightGain: number;
  hasMonthlyWeightData: boolean;
  activeFlocks: number;
  avgFeedPerBirdPerDay: number;
  birds: number;
  weightSamplingCount: number;
};

type FCRData = {
  totalFeedUsed: number;
  weightGain: number;
  fcr: number;
  hasWeightData: boolean;
  sampleCount: number;
  weightGainDetails: {
    initialWeight: number;
    finalWeight: number;
    weightGain: number;
    sampleCount: number;
    firstSamplingDate: Date | null;
    lastSamplingDate: Date | null;
    averageDailyGain: number;
    initialAverageWeight: number;
    finalAverageWeight: number;
  };
  perFlockData: Array<{
    flockId: string;
    batchCode: string;
    feedUsed: number;
    weightGain: number;
    fcr: number;
    hasWeightData: boolean;
    sampleCount: number;
    initialWeight: number;
    finalWeight: number;
    averageDailyGain: number;
  }>;
  weightSamplingInsights: Array<{
    date: Date;
    averageWeight: number;
    sampleSize: number;
    totalWeight: number;
  }>;
  weightSamplings: Array<{
    date: Date;
    averageWeight: number;
    sampleSize: number;
    totalWeight: number;
  }>;
};

export function FCRAnalytics() {
  const t = useTranslations("feed.analytics");
  const tCommon = useTranslations("common");
  const [selectedFlock, setSelectedFlock] = useState<string>("all");
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [fcrData, setFCRData] = useState<FCRData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [fcrLoading, setFcrLoading] = useState(true);

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
      setFcrLoading(true);
      try {
        const result = await getFeedConversionRatio(selectedFlock === "all" ? undefined : selectedFlock);
        if (result.success && result.data) {
          setFCRData(result.data);
        }
      } catch (error) {
        console.error("Error fetching FCR:", error);
      } finally {
        setFcrLoading(false);
      }
    };

    fetchFCR();
  }, [selectedFlock]);

  const formatFCR = (fcr: number) => {
    if (fcr === 0) return "N/A";
    return fcr.toFixed(2);
  };

  const getFCRStatus = (fcr: number) => {
    if (fcr === 0) return { label: t("noData"), variant: "secondary" as const };
    if (fcr <= 1.5) return { label: t("excellent"), variant: "default" as const };
    if (fcr <= 2.0) return { label: t("good"), variant: "secondary" as const };
    if (fcr <= 2.5) return { label: t("fair"), variant: "outline" as const };
    return { label: t("poor"), variant: "destructive" as const };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t("fcrAnalyticsTitle")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("fcrAnalyticsDescription")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedFlock} onValueChange={setSelectedFlock}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t("selectFlock")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allFlocks")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("monthlyFCR")}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatFCR(statsData?.monthlyFCR || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  {statsData?.hasMonthlyWeightData ? t("thisMonth") : t("noWeightData")}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalFeedUsed")}</CardTitle>
            <Wheat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{(statsData?.feedUsed || 0).toFixed(1)} kg</div>
                <p className="text-xs text-muted-foreground">{t("thisMonth")}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalWeightGain")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{(statsData?.monthlyWeightGain || 0).toFixed(1)} kg</div>
                <p className="text-xs text-muted-foreground">
                  {statsData?.hasMonthlyWeightData ? t("thisMonth") : t("noWeightData")}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("activeFlocks")}</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className="text-2xl font-bold">{statsData?.activeFlocks || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {(statsData?.birds || 0).toLocaleString()} {t("birds")}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FCR Chart */}
      {fcrData?.weightSamplingInsights && fcrData.weightSamplingInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("fcrTrend")}</CardTitle>
            <CardDescription>{t("fcrTrendDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                fcr: {
                  label: "FCR",
                },
              }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fcrData.weightSamplingInsights}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="averageWeight" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name={t("avgWeight")}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

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
                  <TableHead className="text-right">{t("feedUsed")} ({tCommon("kg")})</TableHead>
                  <TableHead className="text-right">{t("weightGain")} ({tCommon("kg")})</TableHead>
                  <TableHead className="text-right">{t("dailyGain")} ({tCommon("kg")}/day)</TableHead>
                  <TableHead className="text-right">{t("fcr")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fcrData.perFlockData
                  .filter((flock) => flock.hasWeightData && flock.feedUsed > 0)
                  .map((flock) => {
                    const status = getFCRStatus(flock.fcr);
                    return (
                      <TableRow key={flock.flockId}>
                        <TableCell className="font-medium">{flock.batchCode}</TableCell>
                        <TableCell className="text-right">
                          {flock.feedUsed.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {flock.weightGain.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {flock.averageDailyGain.toFixed(3)}
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
                <p className="text-2xl font-bold">{(fcrData?.totalFeedUsed || 0).toFixed(2)} {tCommon("kg")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("totalWeightGain")}</p>
                <p className="text-2xl font-bold">{(fcrData?.weightGain || 0).toFixed(2)} {tCommon("kg")}</p>
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
