"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Droplets, Bird, TrendingUp, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [viewingRecord, setViewingRecord] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
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

  const handleView = (record: any) => {
    setViewingRecord(record);
    setIsViewDialogOpen(true);
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

  const columns = waterConsumptionColumns(handleView, handleEdit, handleDelete, t, tCommon);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
                <div className="text-2xl font-bold text-blue-600">
                  {(stats?.todayConsumption || 0).toFixed(1)}L
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('stats.litersToday')}
                </p>
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
                  {(stats?.weekConsumption || 0).toFixed(1)}L
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('stats.litersThisWeek')}
                </p>
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
                  {(stats?.monthConsumption || 0).toFixed(1)}L
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('stats.litersThisMonth')}
                </p>
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
                <p className="text-xs text-muted-foreground">
                  {t('stats.trackedFlocks')}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
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

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="pb-4 text-center">
            <DialogTitle className="text-xl font-semibold text-center">Water Consumption Record Details</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground text-center">
              Detailed information about the water consumption record
            </DialogDescription>
          </DialogHeader>
          
          {viewingRecord && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Flock</Label>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-sm">
                        {viewingRecord.flock?.batchCode || "Unknown"}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {viewingRecord.flock?.breed || "Unknown"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {viewingRecord.flock?.currentCount || 0} birds
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Recorded By</Label>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-sm">
                        {viewingRecord.recordedBy?.name || "Unknown"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {viewingRecord.recordedBy?.email || "No email"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Consumption Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Consumption Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                    <p className="text-sm font-medium">{format(new Date(viewingRecord.date), "MMM dd, yyyy")}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Total Consumption</Label>
                    <p className="text-sm font-medium">{viewingRecord.consumption} Liters</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Per Bird</Label>
                    <p className="text-sm font-medium">
                      {viewingRecord.flock?.currentCount 
                        ? (viewingRecord.consumption / viewingRecord.flock.currentCount).toFixed(2) + "L"
                        : "N/A"
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewingRecord.notes && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Notes</h3>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">{viewingRecord.notes}</p>
                  </div>
                </div>
              )}

              {/* Record Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Record Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(viewingRecord.createdAt).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(viewingRecord.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        handleConfirm={confirmDelete}
        title={t('dialog.deleteTitle')}
        desc={t('dialog.deleteDescription')}
        confirmText={t('dialog.deleteButton')}
        cancelBtnText={t('cancel')}
        isLoading={actionLoading === "delete"}
        destructive
      />
    </div>
  );
}

