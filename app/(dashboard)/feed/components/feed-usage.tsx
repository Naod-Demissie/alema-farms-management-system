"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, TrendingUp, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UsageTable } from "./usage-table";
import { usageColumns } from "./usage-columns";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FeedUsageDialog } from "./feed-usage-dialog";
import { 
  getFeedUsageAction, 
  createFeedUsageAction, 
  updateFeedUsageAction, 
  deleteFeedUsageAction 
} from "@/app/actions/feed-usage";
import { feedTypeLabels, feedTypeColors } from "@/lib/feed-program";
import { useSession } from "@/lib/auth-client";

type FeedUsageFormData = {
  flockId: string;
  date: Date;
  amountUsed: number;
  notes?: string;
};

export function FeedUsage() {
  const { data: session } = useSession();
  const currentUser = session?.user;
  
  const [feedUsage, setFeedUsage] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | null;
    item: any | null;
  }>({
    open: false,
    type: null,
    item: null,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchFeedUsage();
  }, []);

  const fetchFeedUsage = async () => {
    try {
      setLoading(true);
      const result = await getFeedUsageAction();
      if (result && result.success) {
        setFeedUsage(result.data || []);
      } else {
        console.error("Failed to fetch feed usage:", result?.error || "Unknown error");
        setFeedUsage([]);
      }
    } catch (error) {
      console.error("Error fetching feed usage:", error);
      setFeedUsage([]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FeedUsageFormData) => {
    try {
      setLoading(true);
      let result;
      
      if (editingItem) {
        // Update existing item
        result = await updateFeedUsageAction(editingItem.id, data);
        if (result.success) {
          toast.success("Feed usage record updated successfully!");
        } else {
          toast.error("Failed to update feed usage record", {
            description: result.error || "An unexpected error occurred",
          });
          return;
        }
      } else {
        // Add new item
        result = await createFeedUsageAction(data);
        if (result.success) {
          toast.success("Feed usage record created successfully!");
        } else {
          toast.error("Failed to create feed usage record", {
            description: result.error || "An unexpected error occurred",
          });
          return;
        }
      }
      
      await fetchFeedUsage();
      setIsAddDialogOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Error saving feed usage record:", error);
      toast.error("Failed to save feed usage record", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (item: any) => {
    setViewingItem(item);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsAddDialogOpen(true);
  };

  const handleDeleteClick = (item: any) => {
    setConfirmDialog({
      open: true,
      type: 'delete',
      item: item,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.type) return;

    if (confirmDialog.type === 'delete' && confirmDialog.item) {
      await executeDeleteRecord(confirmDialog.item);
    }

    setConfirmDialog({
      open: false,
      type: null,
      item: null,
    });
  };

  const executeDeleteRecord = async (item: any) => {
    setActionLoading(item.id);
    try {
      const result = await deleteFeedUsageAction(item.id);
      
      if (result.success) {
        toast.success("Feed usage record deleted successfully!");
        await fetchFeedUsage();
      } else {
        toast.error("Failed to delete feed usage record", {
          description: result.error || "An unexpected error occurred",
        });
      }
    } catch (error) {
      console.error("Error deleting feed usage record:", error);
      toast.error("Failed to delete feed usage record", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setIsAddDialogOpen(true);
  };

  // Calculate stats
  const totalUsage = feedUsage.reduce((sum, item) => sum + (item.amountUsed || 0), 0);
  const uniqueFlocks = new Set(feedUsage.map(item => item.flockId)).size;
  const todayUsage = feedUsage.filter(item => {
    const itemDate = new Date(item.date);
    const today = new Date();
    return itemDate.toDateString() === today.toDateString();
  }).reduce((sum, item) => sum + (item.amountUsed || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{totalUsage.toFixed(1)}kg</div>
                <p className="text-xs text-muted-foreground">
                  All time feed consumption
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Flocks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{uniqueFlocks}</div>
                <p className="text-xs text-muted-foreground">
                  Flocks with usage records
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Usage</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold text-green-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">{todayUsage.toFixed(1)}kg</div>
                <p className="text-xs text-muted-foreground">
                  Feed consumed today
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{feedUsage.length}</div>
                <p className="text-xs text-muted-foreground">
                  Usage records tracked
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
              <CardTitle>Feed Usage Tracking</CardTitle>
              <CardDescription>
                Track daily feed consumption per flock and monitor feeding patterns.
              </CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Record Usage
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading usage records...</p>
              </div>
            </div>
          ) : (
            <UsageTable
              columns={usageColumns(handleView, handleEdit, handleDeleteClick)}
              data={feedUsage}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          )}
        </CardContent>
      </Card>

      {/* Feed Usage Dialog */}
      <FeedUsageDialog
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          setEditingItem(null);
        }}
        onSubmit={onSubmit}
        initialData={editingItem ? {
          flockId: editingItem.flockId,
          date: new Date(editingItem.date),
          amountUsed: editingItem.amountUsed,
          notes: editingItem.notes || "",
        } : undefined}
        title={editingItem ? "Edit Feed Usage" : "Record Feed Usage"}
        description={editingItem ? "Update the feed usage record below." : "Record a new feed usage for a flock."}
        submitButtonText={editingItem ? "Update Usage" : "Record Usage"}
      />

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold">Feed Usage Record Details</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Detailed information about the feed usage record
            </DialogDescription>
          </DialogHeader>
          
          {viewingItem && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Flock</Label>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-sm">
                        {viewingItem.flock?.batchCode || "Unknown"}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {viewingItem.flock?.breed || "Unknown"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {viewingItem.flock?.currentCount || 0} birds
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Feed Type</Label>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${feedTypeColors[viewingItem.feed?.feedType as keyof typeof feedTypeColors]} text-sm`}>
                        {feedTypeLabels[viewingItem.feed?.feedType as keyof typeof feedTypeLabels] || viewingItem.feed?.feedType || "Unknown"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {viewingItem.feed?.supplier?.name || "No supplier"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Usage Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Usage Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                    <p className="text-sm font-medium">{format(new Date(viewingItem.date), "MMM dd, yyyy")}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Amount Used</Label>
                    <p className="text-sm font-medium">{viewingItem.amountUsed} {viewingItem.unit}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Per Bird</Label>
                    <p className="text-sm font-medium">
                      {viewingItem.flock?.currentCount 
                        ? ((viewingItem.amountUsed / viewingItem.flock.currentCount) * 1000).toFixed(1) + "g"
                        : "N/A"
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewingItem.notes && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Notes</h3>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">{viewingItem.notes}</p>
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
                      {new Date(viewingItem.createdAt).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(viewingItem.updatedAt).toLocaleString()}
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

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title="Delete Feed Usage Record"
        desc={`Are you sure you want to delete this feed usage record? This action cannot be undone and the record will be permanently removed.`}
        confirmText="Delete Record"
        cancelBtnText="Cancel"
        destructive={true}
        handleConfirm={handleConfirmAction}
        isLoading={actionLoading === confirmDialog.item?.id}
      />
    </div>
  );
}