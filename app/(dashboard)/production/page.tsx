"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Egg, Bird, Droplets, RefreshCw, AlertCircle, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { 
  eggProductionColumns, 
  broilerSalesColumns, 
  manureProductionColumns 
} from "./components/production-columns";
import { ProductionForm } from "./components/production-form";
import { 
  getEggProduction, 
  getBroilerSales, 
  getManureProduction,
  deleteEggProduction,
  deleteBroilerSales,
  deleteManureProduction,
  updateEggProduction,
  updateBroilerSales,
  updateManureProduction
} from "@/server/production";
import { getFlocks } from "@/server/flocks";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { format } from "date-fns";

interface Flock {
  id: string;
  batchCode: string;
  breed: string;
  currentCount: number;
}

export default function ProductionManagementPage() {
  const [activeTab, setActiveTab] = useState("eggs");
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
            breed: flock.breed,
            currentCount: flock.currentCount
          })));
        } else {
          console.error("Failed to fetch flocks:", result.message);
          toast.error("Failed to fetch flocks");
          setFlocks([]);
        }
      } catch (error) {
        console.error("Error fetching flocks:", error);
        toast.error("Error fetching flocks");
        setFlocks([]);
      } finally {
        setFlocksLoading(false);
      }
    };
    fetchFlocks();
  }, []);

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
          result = await getBroilerSales({}, { page: 1, limit: 100 });
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
        toast.error("Failed to fetch production data");
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch production data");
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
          result = await deleteBroilerSales(confirmDialog.record.id);
          break;
        case "manure":
          result = await deleteManureProduction(confirmDialog.record.id);
          break;
        default:
          return;
      }

      if (result.success) {
        toast.success("Record deleted successfully");
        // Refresh data after successful deletion
        fetchData();
        setConfirmDialog({ open: false, type: null, record: null });
      } else {
        toast.error(result.message || "Failed to delete record");
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
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
        return eggProductionColumns(handleView, handleEdit, handleDeleteClick);
      case "broiler":
        return broilerSalesColumns(handleView, handleEdit, handleDeleteClick);
      case "manure":
        return manureProductionColumns(handleView, handleEdit, handleDeleteClick);
      default:
        return eggProductionColumns(handleView, handleEdit, handleDeleteClick);
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
        return "Egg Production";
      case "broiler":
        return "Broiler Sales";
      case "manure":
        return "Manure Production";
      default:
        return "Egg Production";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Production Management</h1>
        <p className="text-muted-foreground">
          Track and manage egg production, broiler sales, and manure production for your poultry operation.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="eggs" className="flex items-center gap-2">
            <Egg className="h-4 w-4" />
            Egg Production
          </TabsTrigger>
          <TabsTrigger value="broiler" className="flex items-center gap-2">
            <Bird className="h-4 w-4" />
            Broiler Sales
          </TabsTrigger>
          <TabsTrigger value="manure" className="flex items-center gap-2">
            <Droplets className="h-4 w-4" />
            Manure Production
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Informative Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Production</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
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
                  {activeTab === "eggs" ? "Eggs collected today" : 
                   activeTab === "broiler" ? "Birds sold today" : 
                   "kg produced today"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week's Production</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
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
                  {activeTab === "eggs" ? "Eggs collected this week" : 
                   activeTab === "broiler" ? "Birds sold this week" : 
                   "kg produced this week"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month's Production</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
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
                  {activeTab === "eggs" ? "Eggs collected this month" : 
                   activeTab === "broiler" ? "Birds sold this month" : 
                   "kg produced this month"}
                </p>
              </CardContent>
            </Card>

            {activeTab === "eggs" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Quality Rate</CardTitle>
                  <Egg className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
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
                    Normal quality eggs
                  </p>
                </CardContent>
              </Card>
            )}

            {activeTab === "broiler" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <Bird className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${data.reduce((sum, record) => sum + (record.totalAmount || 0), 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total sales revenue
                  </p>
                </CardContent>
              </Card>
            )}

            {activeTab === "manure" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Daily</CardTitle>
                  <Droplets className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(() => {
                      const totalManure = data.reduce((sum, record) => sum + (record.quantity || 0), 0);
                      const days = data.length || 1;
                      return (totalManure / days).toFixed(1);
                    })()}kg
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average daily production
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {getTabIcon()}
                  {getTabTitle()}
                </CardTitle>
                <CardDescription>
                  Manage and track {activeTab === "broiler" ? "broiler sales" : activeTab} records
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={fetchData}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add {activeTab === "broiler" ? "Sale" : "Record"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading data...</p>
                  </div>
                </div>
              ) : (
                <DataTable
                  columns={getColumns()}
                  data={data}
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
      <Dialog open={isFormOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsFormOpen(false);
          setIsEditOpen(false);
          setEditingRecord(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditOpen ? "Edit" : "Add"} {activeTab === "eggs" ? "Egg Production" : activeTab === "broiler" ? "Broiler Sale" : "Manure Production"}
            </DialogTitle>
            <DialogDescription>
              {isEditOpen 
                ? "Update the production record details below." 
                : "Add a new production record to your system."
              }
            </DialogDescription>
          </DialogHeader>
          <ProductionForm
            flocks={flocks}
            flocksLoading={flocksLoading}
            productionType={activeTab as "eggs" | "broiler" | "manure"}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setIsFormOpen(false);
              setIsEditOpen(false);
              setEditingRecord(null);
            }}
            initialData={editingRecord ? {
              id: editingRecord.id,
              flockId: editingRecord.flockId,
              date: format(new Date(editingRecord.date), "yyyy-MM-dd"),
              ...(activeTab === "eggs" ? {
                totalCount: editingRecord.totalCount,
                gradeCounts: editingRecord.gradeCounts
              } : {
                quantity: editingRecord.quantity
              }),
              ...(activeTab === "broiler" && {
                unit: editingRecord.unit,
                pricePerUnit: editingRecord.pricePerUnit,
                totalAmount: editingRecord.totalAmount,
                buyer: editingRecord.buyer
              }),
              ...(activeTab === "manure" && {
                unit: editingRecord.unit
              }),
              notes: editingRecord.notes || ""
            } : undefined}
          />
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Production Record Details</DialogTitle>
            <DialogDescription>
              View detailed information about this {activeTab === "broiler" ? "broiler sale" : activeTab} record
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Flock</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedRecord.flock?.batchCode || selectedRecord.flockId}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedRecord.date), "MMM dd, yyyy")}
                  </p>
                </div>
                {activeTab === "eggs" ? (
                  <>
                    <div>
                      <label className="text-sm font-medium">Total Count</label>
                      <p className="text-sm text-muted-foreground">{selectedRecord.totalCount} eggs</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Grade Breakdown</label>
                      <div className="flex gap-2 text-sm">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          Normal: {selectedRecord.gradeCounts?.normal || 0}
                        </span>
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                          Cracked: {selectedRecord.gradeCounts?.cracked || 0}
                        </span>
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                          Spoiled: {selectedRecord.gradeCounts?.spoiled || 0}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="text-sm font-medium">Quantity</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedRecord.quantity} {selectedRecord.unit || "units"}
                    </p>
                  </div>
                )}
                {activeTab === "broiler" && (
                  <>
                    <div>
                      <label className="text-sm font-medium">Price per Unit</label>
                      <p className="text-sm text-muted-foreground">
                        {selectedRecord.pricePerUnit ? `$${selectedRecord.pricePerUnit.toFixed(2)}` : "Not specified"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Total Amount</label>
                      <p className="text-sm text-muted-foreground">
                        {selectedRecord.totalAmount ? `$${selectedRecord.totalAmount.toFixed(2)}` : "Not specified"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Buyer</label>
                      <p className="text-sm text-muted-foreground">{selectedRecord.buyer || "Not specified"}</p>
                    </div>
                  </>
                )}
              </div>
              {selectedRecord.notes && (
                <div>
                  <label className="text-sm font-medium">Notes</label>
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
        title="Delete Record"
        desc="Are you sure you want to delete this record? This action cannot be undone."
        confirmText="Delete"
        cancelBtnText="Cancel"
        destructive={confirmDialog.type === 'delete'}
        handleConfirm={handleConfirmAction}
        isLoading={actionLoading === confirmDialog.record?.id}
      />
    </div>
  );
}