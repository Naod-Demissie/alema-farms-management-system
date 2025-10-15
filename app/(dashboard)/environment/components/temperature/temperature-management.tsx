"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Thermometer } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTemperatureRecords, getTemperatureStats } from "../../server/temperature";
import { getFlocks } from "@/app/(dashboard)/flocks/server/flocks";
import { TemperatureDialog } from "./temperature-dialog";
import { TemperatureTable } from "./temperature-table";

type TemperatureRecord = {
  id: string;
  flockId: string;
  date: Date;
  minTemp: number;
  maxTemp: number;
  avgTemp: number | null;
  notes: string | null;
  flock: {
    batchCode: string;
    currentCount: number;
  };
  recordedBy: {
    name: string;
  } | null;
};

type StatsData = {
  today: { avg: number; min: number; max: number };
  week: { avg: number; min: number; max: number };
  month: { avg: number; min: number; max: number };
  totalRecords: number;
};

type Flock = {
  id: string;
  batchCode: string;
  currentCount: number;
};

export function TemperatureManagement() {
  const t = useTranslations("environment.temperature");
  const [records, setRecords] = useState<TemperatureRecord[]>([]);
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [flocksLoading, setFlocksLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const result = await getTemperatureRecords();
      if (result.success && result.data) {
        setRecords(result.data as TemperatureRecord[]);
      }
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const result = await getTemperatureStats();
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchFlocks = async () => {
    setFlocksLoading(true);
    try {
      const result = await getFlocks({}, { page: 1, limit: 100 });
      if (result.success && result.data) {
        setFlocks(result.data.map(flock => ({
          id: flock.id,
          batchCode: flock.batchCode,
          currentCount: flock.currentCount
        })));
      }
    } catch (error) {
      console.error("Error fetching flocks:", error);
    } finally {
      setFlocksLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchStats();
    fetchFlocks();
  }, []);

  const handleSuccess = () => {
    fetchRecords();
    fetchStats();
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("todayAvg")}
            </CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.today.avg.toFixed(1) || 0}°C
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("rangeToday", {
                    min: stats?.today.min.toFixed(1) || 0,
                    max: stats?.today.max.toFixed(1) || 0,
                  })}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("weekAvg")}
            </CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.week.avg.toFixed(1) || 0}°C
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("thisWeek")}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("monthAvg")}
            </CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.month.avg.toFixed(1) || 0}°C
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("thisMonth")}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalRecords")}
            </CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.totalRecords || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("readings")}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("title")}</CardTitle>
              <CardDescription>{t("description")}</CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("addRecord")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading || flocksLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">{t("loading")}</p>
              </div>
            </div>
          ) : (
            <TemperatureTable records={records} flocks={flocks} onSuccess={handleSuccess} />
          )}
        </CardContent>
      </Card>

      <TemperatureDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
