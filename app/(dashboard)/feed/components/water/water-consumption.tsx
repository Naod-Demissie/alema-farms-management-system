"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Droplets, Bird, TrendingUp, Calendar } from "lucide-react";
import { WaterDialog } from "./water-dialog";
import { WaterTable } from "./water-table";
import { waterConsumptionColumns } from "./water-columns";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import {
  getWaterConsumption,
  createWaterConsumption,
  updateWaterConsumption,
  deleteWaterConsumption,
  getWaterConsumptionStats,
} from "../../server/water-consumption";
import { getFlocks } from "@/app/(dashboard)/flocks/server/flocks";

export function WaterConsumption() {
  const t = useTranslations('feed.water');
  const tCommon = useTranslations('feed.common');
  
  const [records, setRecords] = useState<any[]>([]);
  const [flocks, setFlocks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    record: any | null;
  }>({
    open: false,
    record: null,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [waterRes, flocksRes, statsRes] = await Promise.all([
        getWaterConsumption(1, 100),
        getFlocks(),
        getWaterConsumptionStats(),
      ]);

      if (waterRes.success && waterRes.data) {
        setRecords(waterRes.data.records || []);
      }
      if (flocksRes.success) {
        setFlocks(flocksRes.data || []);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error("Error loading water consumption data:", error);
      toast.error(t('toasts.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    setActionLoading(editingRecord ? "update" : "create");
    try {
      const result = editingRecord
        ? await updateWaterConsumption(editingRecord.id, data)
        : await createWaterConsumption(data);

      if (result.success) {
        toast.success(editingRecord ? t('toasts.updated') : t('toasts.created'));
        await loadData();
        setIsDialogOpen(false);
        setEditingRecord(null);
      } else {
        toast.error(result.error || (editingRecord ? t('toasts.updateError') : t('toasts.createError')));
      }
    } catch (error) {
      console.error("Error submitting water consumption:", error);
      toast.error(editingRecord ? t('toasts.updateError') : t('toasts.createError'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setIsDialogOpen(true);
  };

  const handleDelete = (record: any) => {
    setConfirmDialog({
      open: true,
      record,
    });
  };

  const confirmDelete = async () => {
    if (!confirmDialog.record) return;

    setActionLoading("delete");
    try {
      const result = await deleteWaterConsumption(confirmDialog.record.id);

      if (result.success) {
        toast.success(t('toasts.deleted'));
        await loadData();
      } else {
        toast.error(result.error || t('toasts.deleteError'));
      }
    } catch (error) {
      console.error("Error deleting water consumption:", error);
      toast.error(t('toasts.deleteError'));
    } finally {
      setActionLoading(null);
      setConfirmDialog({ open: false, record: null });
    }
  };

  const columns = waterConsumptionColumns(handleEdit, handleDelete, t, tCommon);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.todayConsumption')}</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(stats?.todayConsumption || 0).toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">{t('stats.litersToday')}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.weekConsumption')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(stats?.weekConsumption || 0).toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">{t('stats.litersThisWeek')}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.monthConsumption')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(stats?.monthConsumption || 0).toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">{t('stats.litersThisMonth')}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.activeFlocks')}</CardTitle>
            <Bird className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.activeFlocks || 0}</div>
                <p className="text-xs text-muted-foreground">{t('stats.trackedFlocks')}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>{t('title')}</CardTitle>
              <CardDescription>
                {t('recordsCount', { count: records.length })}
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setEditingRecord(null);
                setIsDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('addRecord')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">{t('loading.data')}</p>
              </div>
            </div>
          ) : (
            <WaterTable columns={columns} data={records} flocks={flocks} />
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <WaterDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingRecord(null);
        }}
        onSubmit={handleSubmit}
        flocks={flocks}
        initialData={editingRecord}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        handleConfirm={confirmDelete}
        title={t('dialog.deleteTitle')}
        desc={t('dialog.deleteDescription')}
        confirmText={t('dialog.deleteButton')}
        cancelBtnText={t('dialog.cancelButton')}
        isLoading={actionLoading === "delete"}
        destructive
      />
    </div>
  );
}

