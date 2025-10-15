"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Lightbulb } from "lucide-react";
import { useTranslations } from "next-intl";
import { getLightingRecords, getLightingStats } from "../../server/lighting";
import { getFlocks } from "@/app/(dashboard)/flocks/server/flocks";
import { LightingDialog } from "./lighting-dialog";
import { LightingTable } from "./lighting-table";

type LightingRecord = {
  id: string;
  flockId: string;
  date: Date;
  lightOnTime: string;
  lightOffTime: string;
  totalHours: number;
  interruptedHours: number | null;
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
  today: { totalHours: number; interruptedHours: number };
  week: { totalHours: number; interruptedHours: number };
  month: { totalHours: number; interruptedHours: number };
  totalRecords: number;
};

type Flock = {
  id: string;
  batchCode: string;
  currentCount: number;
};

export function LightingManagement() {
  const t = useTranslations("environment.lighting");
  const [records, setRecords] = useState<LightingRecord[]>([]);
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [flocksLoading, setFlocksLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const result = await getLightingRecords();
      if (result.success && result.data) {
        setRecords(result.data as LightingRecord[]);
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
      const result = await getLightingStats();
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
              {t("todayHours")}
            </CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.today.totalHours.toFixed(1) || 0}h
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("hoursToday")}
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
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.week.totalHours.toFixed(1) || 0}h
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
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.month.totalHours.toFixed(1) || 0}h
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
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
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
                  {t("schedules")}
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
            <LightingTable records={records} flocks={flocks} onSuccess={handleSuccess} />
          )}
        </CardContent>
      </Card>

      <LightingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
