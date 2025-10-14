"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Egg, Bird, Droplets, AlertCircle, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import { 
  eggProductionColumns, 
  broilerProductionColumns, 
  manureProductionColumns 
} from "./components/table/production-columns";
import { ProductionTableToolbar } from "./components/table/production-table-toolbar";
import { ProductionTable } from "./components/table/production-table";
import { 
  getEggProduction, 
  getBroilerProduction, 
  getManureProduction,
  deleteEggProduction,
  deleteBroilerProduction,
  deleteManureProduction,
  updateEggProduction,
  updateBroilerProduction,
  updateManureProduction
} from "@/app/(dashboard)/production/server/production";
import { getFlocks } from "@/app/(dashboard)/flocks/server/flocks";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ProductionDialog } from "@/app/(dashboard)/production/components/dialogs/production-dialog";
import { format } from "date-fns";
import { PageBanner } from "@/components/ui/page-banner";

interface Flock {
  id: string;
  batchCode: string;
  currentCount: number;
}

export default function ProductionManagementPage() {
  const [activeTab, setActiveTab] = useState("eggs");
  const t = useTranslations('production');
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [loading, setLoading] = useState(true);
  const [flocksLoading, setFlocksLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | null;
    record: any | null;
  }>({
    open: false,
    type: null,
    record: null,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch flocks
  useEffect(() => {
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
        } else {
          console.error("Failed to fetch flocks:", result.message);
          toast.error(t('toast.fetchFlocksFailed'));
          setFlocks([]);
        }
      } catch (error) {
        console.error("Error fetching flocks:", error);
        toast.error(t('toast.fetchFlocksError'));
        setFlocks([]);
      } finally {
        setFlocksLoading(false);
      }
    };
    fetchFlocks();
  }, [t]);

  // Fetch production data
  const fetchData = async () => {
    setLoading(true);
    try {
      let result;
      switch (activeTab) {
        case "eggs":
          result = await getEggProduction({}, { page: 1, limit: 100 });
          break;
        case "broiler":
          result = await getBroilerProduction({}, { page: 1, limit: 100 });
          break;
        case "manure":
          result = await getManureProduction({}, { page: 1, limit: 100 });
          break;
        default:
          result = { success: false, data: [] };
      }
      
      if (result.success) {
        setData(result.data || []);
      } else {
        toast.error(t('toast.fetchFailed'));
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(t('toast.fetchFailed'));
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleView = (record: any) => {
    setSelectedRecord(record);
    setIsViewOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (record: any) => {
    setConfirmDialog({
      open: true,
      type: 'delete',
      record: record,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.record) return;

    setActionLoading(confirmDialog.record.id);
    try {
      let result;
      switch (activeTab) {
        case "eggs":
          result = await deleteEggProduction(confirmDialog.record.id);
          break;
        case "broiler":
          result = await deleteBroilerProduction(confirmDialog.record.id);
          break;
        case "manure":
          result = await deleteManureProduction(confirmDialog.record.id);
          break;
        default:
          return;
      }

      if (result.success) {
        toast.success(t('toast.deleteSuccess'));
        // Refresh data after successful deletion
        fetchData();
        setConfirmDialog({ open: false, type: null, record: null });
      } else {
        toast.error(result.message || t('toast.deleteFailed'));
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error(t('toast.deleteFailed'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setIsEditOpen(false);
    setEditingRecord(null);
    // Refresh data after successful form submission
    fetchData();
  };

  const getColumns = () => {
    switch (activeTab) {
      case "eggs":
        return eggProductionColumns(handleView, handleEdit, handleDeleteClick, t);
      case "broiler":
        return broilerProductionColumns(handleView, handleEdit, handleDeleteClick, t);
      case "manure":
        return manureProductionColumns(handleView, handleEdit, handleDeleteClick, t);
      default:
        return eggProductionColumns(handleView, handleEdit, handleDeleteClick, t);
    }
  };

  const getTabIcon = () => {
    switch (activeTab) {
      case "eggs":
        return <Egg className="h-4 w-4" />;
      case "broiler":
        return <Bird className="h-4 w-4" />;
      case "manure":
        return <Droplets className="h-4 w-4" />;
      default:
        return <Egg className="h-4 w-4" />;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case "eggs":
        return t('tabs.eggs');
      case "broiler":
        return t('tabs.broiler');
      case "manure":
        return t('tabs.manure');
      default:
        return t('tabs.eggs');
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <PageBanner
        title={t('title')}
        description={t('description')}
        imageSrc="/banner-bg-image.webp"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-1 h-auto">
          <TabsTrigger 
            value="eggs" 
            className="flex items-center gap-2"
          >
            <Egg className="h-4 w-4" />
            {t('tabs.eggs')}
          </TabsTrigger>
          <TabsTrigger 
            value="broiler" 
            className="flex items-center gap-2"
          >
            <Bird className="h-4 w-4" />
            {t('tabs.broiler')}
          </TabsTrigger>
          <TabsTrigger 
            value="manure" 
            className="flex items-center gap-2"
          >
            <Droplets className="h-4 w-4" />
            {t('tabs.manure')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Informative Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('cards.todayProduction')}</CardTitle>
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
                      {(() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const tomorrow = new Date(today);
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        
                        const todayRecords = data.filter(record => {
                          const recordDate = new Date(record.date);
                          return recordDate >= today && recordDate < tomorrow;
                        });
                        
                        if (activeTab === "eggs") {
                          return todayRecords.reduce((sum, record) => sum + (record.totalCount || 0), 0).toLocaleString();
                        } else {
                          return todayRecords.reduce((sum, record) => sum + (record.quantity || 0), 0).toLocaleString();
                        }
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activeTab === "eggs" ? t('cards.eggsCollectedToday') : 
                       activeTab === "broiler" ? t('cards.birdsAvailableToday') : 
                       t('cards.bagsProducedToday')}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('cards.weekProduction')}</CardTitle>
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
                      {(() => {
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        weekAgo.setHours(0, 0, 0, 0);
                        
                        const weekRecords = data.filter(record => {
                          const recordDate = new Date(record.date);
                          return recordDate >= weekAgo;
                        });
                        
                        if (activeTab === "eggs") {
                          return weekRecords.reduce((sum, record) => sum + (record.totalCount || 0), 0).toLocaleString();
                        } else {
                          return weekRecords.reduce((sum, record) => sum + (record.quantity || 0), 0).toLocaleString();
                        }
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activeTab === "eggs" ? t('cards.eggsCollectedWeek') : 
                       activeTab === "broiler" ? t('cards.birdsAvailableWeek') : 
                       t('cards.bagsProducedWeek')}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('cards.monthProduction')}</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-2xl font-bold">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {(() => {
                        const monthStart = new Date();
                        monthStart.setDate(1);
                        monthStart.setHours(0, 0, 0, 0);
                        
                        const monthRecords = data.filter(record => {
                          const recordDate = new Date(record.date);
                          return recordDate >= monthStart;
                        });
                        
                        if (activeTab === "eggs") {
                          return monthRecords.reduce((sum, record) => sum + (record.totalCount || 0), 0).toLocaleString();
                        } else {
                          return monthRecords.reduce((sum, record) => sum + (record.quantity || 0), 0).toLocaleString();
                        }
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activeTab === "eggs" ? t('cards.eggsCollectedMonth') : 
                       activeTab === "broiler" ? t('cards.birdsAvailableMonth') : 
                       t('cards.bagsProducedMonth')}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {activeTab === "eggs" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('cards.qualityRate')}</CardTitle>
                  <Egg className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-2xl font-bold">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        {(() => {
                          const totalEggs = data.reduce((sum, record) => sum + (record.totalCount || 0), 0);
                          const normalEggs = data.reduce((sum, record) => {
                            const counts = record.gradeCounts || {};
                            return sum + (counts.normal || 0);
                          }, 0);
                          return totalEggs > 0 ? ((normalEggs / totalEggs) * 100).toFixed(1) : 0;
                        })()}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('cards.normalQualityEggs')}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            )}


            {activeTab === "manure" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('cards.avgDaily')}</CardTitle>
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
                        {(() => {
                          const totalManure = data.reduce((sum, record) => sum + (record.quantity || 0), 0);
                          const days = data.length || 1;
                          return (totalManure / days).toFixed(1);
                        })()} {t('cards.bags')}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('cards.avgDailyProduction')}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {getTabIcon()}
                    {getTabTitle()}
                  </CardTitle>
                  <CardDescription>
                    {t('table.manageAndTrack', { type: activeTab })}
                  </CardDescription>
                </div>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('buttons.addRecord')}
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
                <ProductionTable
                  columns={getColumns()}
                  data={data}
                  flocks={flocks}
                  productionType={activeTab as "eggs" | "broiler" | "manure"}
                  enableFiltering={true}
                  enablePagination={true}
                  enableSorting={true}
                  pageSize={10}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Form Dialog */}
      <ProductionDialog
        open={isFormOpen || isEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setIsEditOpen(false);
            setEditingRecord(null);
          }
        }}
        productionType={activeTab as "eggs" | "broiler" | "manure"}
        flocks={flocks}
        flocksLoading={flocksLoading}
        initialData={editingRecord ? {
          id: editingRecord.id,
          flockId: editingRecord.flockId,
          date: new Date(editingRecord.date),
          ...(activeTab === "eggs" ? {
            totalCount: editingRecord.totalCount,
            gradeCounts: editingRecord.gradeCounts
          } : {
            quantity: editingRecord.quantity
          }),
          ...(activeTab === "broiler" && {
            pricePerUnit: editingRecord.pricePerUnit,
            totalAmount: editingRecord.totalAmount,
            buyer: editingRecord.buyer
          }),
          notes: editingRecord.notes || ""
        } : undefined}
        onSuccess={handleFormSuccess}
        loading={loading}
      />

      {/* View Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('dialogs.viewTitle')}</DialogTitle>
            <DialogDescription>
              {t('dialogs.viewDescription', { type: activeTab })}
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('fields.flock')}</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedRecord.flock?.batchCode || selectedRecord.flockId}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">{t('fields.date')}</label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedRecord.date), "MMM dd, yyyy")}
                  </p>
                </div>
                {activeTab === "eggs" ? (
                  <>
                    <div>
                      <label className="text-sm font-medium">{t('fields.totalCount')}</label>
                      <p className="text-sm text-muted-foreground">{selectedRecord.totalCount} {t('fields.eggs')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t('fields.gradeBreakdown')}</label>
                      <div className="flex gap-2 text-sm">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          {t('grades.normal')}: {selectedRecord.gradeCounts?.normal || 0}
                        </span>
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                          {t('grades.cracked')}: {selectedRecord.gradeCounts?.cracked || 0}
                        </span>
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                          {t('grades.spoiled')}: {selectedRecord.gradeCounts?.spoiled || 0}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="text-sm font-medium">{t('fields.quantity')}</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedRecord.quantity} {activeTab === "broiler" ? t('fields.birds') : activeTab === "manure" ? t('fields.bags') : t('fields.units')}
                    </p>
                  </div>
                )}
              </div>
              {selectedRecord.notes && (
                <div>
                  <label className="text-sm font-medium">{t('fields.notes')}</label>
                  <p className="text-sm text-muted-foreground">{selectedRecord.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={t('dialogs.deleteTitle')}
        desc={t('dialogs.deleteDescription')}
        confirmText={t('dialogs.deleteButton')}
        cancelBtnText={t('dialogs.cancelButton')}
        destructive={confirmDialog.type === 'delete'}
        handleConfirm={handleConfirmAction}
        isLoading={actionLoading === confirmDialog.record?.id}
      />
    </div>
  );
}