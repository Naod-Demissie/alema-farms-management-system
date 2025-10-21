"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WeightSamplingDialog } from "../weight-sampling/weight-sampling-dialog";
import { WeightSamplingTable } from "../weight-sampling/weight-sampling-table";
import { WeightTrendChart } from "../weight-sampling/weight-trend-chart";
import { Scale, Plus, TrendingUp } from "lucide-react";

export function WeightSamplingAnalytics() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Weight Sampling Management</h3>
          <p className="text-sm text-muted-foreground">
            Record and track weight sampling data for accurate FCR calculations
          </p>
        </div>
        <WeightSamplingDialog onSuccess={handleRefresh} />
      </div>

      {/* Weight Sampling Table */}
      <WeightSamplingTable 
        key={refreshKey}
        onRefresh={handleRefresh}
      />

      {/* Weight Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Weight Trend Analysis
          </CardTitle>
          <CardDescription>
            Track weight progression over time across all flocks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WeightTrendChart />
        </CardContent>
      </Card>
    </div>
  );
}
