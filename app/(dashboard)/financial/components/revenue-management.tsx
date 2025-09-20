"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, DollarSign, TrendingUp, Eye } from "lucide-react";
import { RevenueFormData, REVENUE_SOURCES } from "@/features/financial/types";
import { RevenueSource } from "@/lib/generated/prisma";
import { 
  getRevenue, 
  createRevenue, 
  updateRevenue, 
  deleteRevenue 
} from "@/server/financial";
import { getFlocks } from "@/server/flocks";
import { toast } from "sonner";
import { RevenueTable } from "./revenue-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { format } from "date-fns";

interface Revenue {
  id: string;
  flockId: string;
  source: string;
  amount: number;
  date: Date;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  flock: {
    batchCode: string;
    breed: string;
  };
}

interface Flock {
  id: string;
  batchCode: string;
  breed: string;
}


export function RevenueManagement() {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [flocks, setFlocks] = useState<Flock[]>([]);
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
  
  const [formData, setFormData] = useState<RevenueFormData>({
    flockId: "",
    source: "egg_sales",
    amount: 0,
    date: new Date(),
    description: "",
  });

  useEffect(() => {
    fetchRevenues();
    fetchFlocks();
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

  const fetchFlocks = async () => {
    try {
      const result = await getFlocks({}, { page: 1, limit: 100 });
      if (result.success && result.data) {
        setFlocks(result.data.map(flock => ({
          id: flock.id,
          batchCode: flock.batchCode,
          breed: flock.breed
        })));
      } else {
        toast.error("Failed to fetch flocks");
        setFlocks([]);
      }
    } catch (error) {
      console.error("Error fetching flocks:", error);
      toast.error("Failed to fetch flocks");
      setFlocks([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let result;
      if (editingRevenue) {
        result = await updateRevenue(editingRevenue.id, {
          source: formData.source,
          amount: formData.amount,
          date: formData.date,
          description: formData.description,
        });
      } else {
        result = await createRevenue({
          flockId: formData.flockId,
          source: formData.source,
          amount: formData.amount,
          date: formData.date,
          description: formData.description,
        });
      }

      if (result.success) {
        toast.success(editingRevenue ? "Revenue updated successfully" : "Revenue created successfully");
        setIsDialogOpen(false);
        setEditingRevenue(null);
        setFormData({
          flockId: "",
          source: "egg_sales",
          amount: 0,
          date: new Date(),
          description: "",
        });
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
    setFormData({
      flockId: revenue.flockId,
      source: revenue.source as RevenueSource,
      amount: revenue.amount,
      date: new Date(revenue.date),
      description: revenue.description || "",
    });
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
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                   <div className="text-2xl font-bold text-green-600">
                     {new Intl.NumberFormat("en-ET", {
                       style: "currency",
                       currency: "ETB",
                     }).format(totalRevenue)}
                   </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenues.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                   <div className="text-2xl font-bold text-green-600">
                     {new Intl.NumberFormat("en-ET", {
                       style: "currency",
                       currency: "ETB",
                     }).format(
                       revenues
                         .filter(r => {
                           const revenueDate = new Date(r.date);
                           const now = new Date();
                           return revenueDate.getMonth() === now.getMonth() &&
                                  revenueDate.getFullYear() === now.getFullYear();
                         })
                         .reduce((sum, r) => sum + r.amount, 0)
                     )}
                   </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Record</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                   <div className="text-2xl font-bold text-green-600">
                     {new Intl.NumberFormat("en-ET", {
                       style: "currency",
                       currency: "ETB",
                     }).format(revenues.length > 0 ? totalRevenue / revenues.length : 0)}
                   </div>
          </CardContent>
        </Card>
      </div>



      {/* Revenue Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Track and manage all farm revenue</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingRevenue(null);
                setFormData({
                  flockId: "",
                  source: "egg_sales",
                  amount: 0,
                  date: new Date(),
                  description: "",
                });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Revenue
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingRevenue ? "Edit Revenue" : "Add New Revenue"}
                </DialogTitle>
                <DialogDescription>
                  {editingRevenue ? "Update revenue details" : "Record a new revenue for your farm"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="flock">Flock</Label>
                    <Select
                      value={formData.flockId}
                      onValueChange={(value) => setFormData({ ...formData, flockId: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select flock" />
                      </SelectTrigger>
                      <SelectContent>
                        {flocks.map((flock) => (
                          <SelectItem key={flock.id} value={flock.id}>
                            {flock.batchCode} ({flock.breed})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="source">Source</Label>
                    <Select
                      value={formData.source}
                      onValueChange={(value) => setFormData({ ...formData, source: value as RevenueSource })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {REVENUE_SOURCES.map((source) => (
                          <SelectItem key={source.value} value={source.value}>
                            {source.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date.toISOString().split('T')[0]}
                      onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Additional details about this revenue..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingRevenue ? "Update Revenue" : "Add Revenue"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
               <CardContent>
                 <RevenueTable
                   data={revenues}
                   onView={handleView}
                   onEdit={handleEdit}
                   onDelete={handleDeleteClick}
                   flocks={flocks}
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
                    {format(new Date(viewingRevenue.date), "PPP")}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Flock</Label>
                  <p className="text-sm font-medium">
                    {viewingRevenue.flock.batchCode} ({viewingRevenue.flock.breed})
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Source</Label>
                  <p className="text-sm font-medium">
                    {REVENUE_SOURCES.find(s => s.value === viewingRevenue.source)?.label || viewingRevenue.source}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                  <p className="text-sm font-medium">
                    {new Intl.NumberFormat("en-ET", {
                      style: "currency",
                      currency: "ETB",
                    }).format(viewingRevenue.amount)}
                  </p>
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
