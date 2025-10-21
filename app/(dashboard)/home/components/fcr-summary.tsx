"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFeedConversionRatio, getFeedEfficiencyStats } from "@/app/(dashboard)/feed/server/feed-analytics";
import { Activity, TrendingUp, Wheat, Scale } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
};

export function FCRSummary() {
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [fcrData, setFcrData] = useState<FCRData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsResult, fcrResult] = await Promise.all([
          getFeedEfficiencyStats(),
          getFeedConversionRatio()
        ]);

        if (statsResult.success && statsResult.data) {
          setStatsData(statsResult.data);
        }

        if (fcrResult.success && fcrResult.data) {
          setFcrData(fcrResult.data);
        }
      } catch (error) {
        console.error("Error fetching FCR data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatFCR = (fcr: number) => {
    if (fcr === 0) return "N/A";
    return fcr.toFixed(2);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Feed Conversion Ratio
          </CardTitle>
          <CardDescription>Current feed efficiency metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Feed Conversion Ratio
        </CardTitle>
        <CardDescription>Current feed efficiency metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Monthly FCR</p>
            <p className="text-2xl font-bold">{formatFCR(statsData?.monthlyFCR || 0)}</p>
            <p className="text-xs text-muted-foreground">
              {statsData?.hasMonthlyWeightData ? "This month" : "No weight data"}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Feed Used</p>
            <p className="text-2xl font-bold">{(statsData?.feedUsed || 0).toFixed(1)} kg</p>
            <p className="text-xs text-muted-foreground">This month</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Weight Gain</p>
            <p className="text-2xl font-bold">{(statsData?.monthlyWeightGain || 0).toFixed(1)} kg</p>
            <p className="text-xs text-muted-foreground">
              {statsData?.hasMonthlyWeightData ? "This month" : "No weight data"}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Active Flocks</p>
            <p className="text-2xl font-bold">{statsData?.activeFlocks || 0}</p>
            <p className="text-xs text-muted-foreground">
              {(statsData?.birds || 0).toLocaleString()} birds
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
