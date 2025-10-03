"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, DollarSign, TrendingUp, Eye } from "lucide-react";
import { RevenueFormData, REVENUE_SOURCES } from "@/features/financial/types";
import { 
  getRevenue, 
  createRevenue, 
  updateRevenue, 
  deleteRevenue 
} from "@/server/financial";
import { toast } from "sonner";
import { RevenueTable } from "./revenue-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { getRevenueSourceBadgeColor } from "@/lib/badge-colors";
import { format } from "date-fns";
import { RevenueDialog } from "./revenue-dialog";

interface Revenue {
  id: string;
  source: string;
  quantity: number | null;
  costPerQuantity: number | null;
  amount: number;
  date: Date;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}



export function RevenueManagement() {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null);
  const [viewingRevenue, setViewingRevenue] = useState<Revenue | null>(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: null as string | null,
    record: null as Revenue | null,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchRevenues();
  }, []);

  const fetchRevenues = async () => {
    try {
      setLoading(true);
      const result = await getRevenue({});
      if (result.success) {
        setRevenues(result.data || []);
      } else {
        toast.error(result.message || "Failed to fetch revenues");
        setRevenues([]);
      }
    } catch (error) {
      console.error("Error fetching revenues:", error);
      toast.error("Failed to fetch revenues");
      setRevenues([]);
    } finally {
      setLoading(false);
    }
  };


  const handleRevenueSubmit = async (data: RevenueFormData) => {
    try {
      let result;
      if (editingRevenue) {
        result = await updateRevenue(editingRevenue.id, {
          source: data.source,
          quantity: data.quantity,
          costPerQuantity: data.costPerQuantity,
          amount: data.amount,
          date: data.date,
          description: data.description,
        });
      } else {
        result = await createRevenue({
          source: data.source,
          quantity: data.quantity,
          costPerQuantity: data.costPerQuantity,
          amount: data.amount,
          date: data.date,
          description: data.description,
        });
      }

      if (result.success) {
        toast.success(editingRevenue ? "Revenue updated successfully" : "Revenue created successfully");
        setIsDialogOpen(false);
        setEditingRevenue(null);
        fetchRevenues();
      } else {
        toast.error(result.message || "Failed to save revenue");
      }
    } catch (error) {
      console.error("Error saving revenue:", error);
      toast.error("Failed to save revenue");
    }
  };

  const handleView = (revenue: Revenue) => {
    setViewingRevenue(revenue);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (revenue: Revenue) => {
    setEditingRevenue(revenue);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (revenue: Revenue) => {
    setConfirmDialog({
      open: true,
      type: "delete",
      record: revenue,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.record) return;

    setActionLoading(confirmDialog.record.id);
    try {
      const result = await deleteRevenue(confirmDialog.record.id);
      if (result.success) {
        toast.success("Revenue deleted successfully");
        fetchRevenues();
        setConfirmDialog({ open: false, type: null, record: null });
      } else {
        toast.error(result.message || "Failed to delete revenue");
      }
    } catch (error) {
      console.error("Error deleting revenue:", error);
      toast.error("Failed to delete revenue");
    } finally {
      setActionLoading(null);
    }
  };

  const totalRevenue = revenues.reduce((sum, revenue) => sum + revenue.amount, 0);
  
  // Calculate revenue for different time periods
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const todayRevenue = revenues
    .filter(r => {
      const revenueDate = new Date(r.date);
      return revenueDate >= today && revenueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    })
    .reduce((sum, r) => sum + r.amount, 0);

  const thisWeekRevenue = revenues
    .filter(r => {
      const revenueDate = new Date(r.date);
      return revenueDate >= startOfWeek;
    })
    .reduce((sum, r) => sum + r.amount, 0);

  const thisMonthRevenue = revenues
    .filter(r => {
      const revenueDate = new Date(r.date);
      return revenueDate >= startOfMonth;
    })
    .reduce((sum, r) => sum + r.amount, 0);

  const thisYearRevenue = revenues
    .filter(r => {
      const revenueDate = new Date(r.date);
      return revenueDate >= startOfYear;
    })
    .reduce((sum, r) => sum + r.amount, 0);

  const sourceSummary = REVENUE_SOURCES.map(source => {
    const sourceRevenues = revenues.filter(r => r.source === source.value);
    const total = sourceRevenues.reduce((sum, r) => sum + r.amount, 0);
    return {
      source: source.value,
      label: source.label,
      total,
      percentage: totalRevenue > 0 ? (total / totalRevenue) * 100 : 0,
      count: sourceRevenues.length,
    };
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold text-green-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat("en-ET", {
                  style: "currency",
                  currency: "ETB",
                }).format(todayRevenue)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week's Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold text-green-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat("en-ET", {
                  style: "currency",
                  currency: "ETB",
                }).format(thisWeekRevenue)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month's Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold text-green-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat("en-ET", {
                  style: "currency",
                  currency: "ETB",
                }).format(thisMonthRevenue)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Year's Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold text-green-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat("en-ET", {
                  style: "currency",
                  currency: "ETB",
                }).format(thisYearRevenue)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>



      {/* Revenue Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Revenue</CardTitle>
              <CardDescription>Track and manage all farm revenue</CardDescription>
            </div>
            <Button onClick={() => {
              setEditingRevenue(null);
              setIsDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Revenue
            </Button>
          </div>
        </CardHeader>
               <CardContent>
                 <RevenueTable
                   data={revenues}
                   onView={handleView}
                   onEdit={handleEdit}
                   onDelete={handleDeleteClick}
                   loading={loading}
                 />
               </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Revenue Details</DialogTitle>
            <DialogDescription>
              View detailed information about this revenue record
            </DialogDescription>
          </DialogHeader>
          {viewingRevenue && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                  <p className="text-sm font-medium">
                    {format(new Date(viewingRevenue.date), "MMM dd, yyyy")}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Source</Label>
                  <div className="mt-1">
                    <Badge className={getRevenueSourceBadgeColor(viewingRevenue.source as any)}>
                      {REVENUE_SOURCES.find(s => s.value === viewingRevenue.source)?.label || viewingRevenue.source}
                    </Badge>
                  </div>
                </div>
                {viewingRevenue.quantity && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Quantity</Label>
                    <p className="text-sm font-medium">{viewingRevenue.quantity}</p>
                  </div>
                )}
                {viewingRevenue.costPerQuantity && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Cost per Quantity</Label>
                    <p className="text-sm font-medium">
                      {new Intl.NumberFormat("en-ET", {
                        style: "currency",
                        currency: "ETB",
                      }).format(viewingRevenue.costPerQuantity)}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Total Amount</Label>
                  <p className="text-lg font-semibold text-green-600">
                    {new Intl.NumberFormat("en-ET", {
                      style: "currency",
                      currency: "ETB",
                    }).format(viewingRevenue.amount)}
                  </p>
                  {viewingRevenue.quantity && viewingRevenue.costPerQuantity && (
                    <p className="text-xs text-muted-foreground">
                      Calculated: {viewingRevenue.quantity} × {viewingRevenue.costPerQuantity} = {viewingRevenue.quantity * viewingRevenue.costPerQuantity}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                  {viewingRevenue.description || "No description provided"}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              handleEdit(viewingRevenue!);
            }}>
              Edit Revenue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reusable Revenue Dialog */}
      <RevenueDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingRevenue(null);
        }}
        onSubmit={handleRevenueSubmit}
        initialData={editingRevenue ? {
          source: editingRevenue.source as any,
          quantity: editingRevenue.quantity || 0,
          costPerQuantity: editingRevenue.costPerQuantity || 0,
          amount: editingRevenue.amount,
          date: new Date(editingRevenue.date),
          description: editingRevenue.description || "",
        } : undefined}
        title={editingRevenue ? "Edit Revenue" : "Add New Revenue"}
        description={editingRevenue ? "Update revenue details" : "Record a new revenue for your farm"}
        submitButtonText={editingRevenue ? "Update Revenue" : "Add Revenue"}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title="Delete Revenue"
        desc={`Are you sure you want to delete this revenue record? This action cannot be undone and the record will be permanently removed.`}
        confirmText="Delete Revenue"
        cancelBtnText="Cancel"
        destructive={true}
        handleConfirm={handleConfirmAction}
        isLoading={actionLoading === confirmDialog.record?.id}
      />
    </div>
  );
}
