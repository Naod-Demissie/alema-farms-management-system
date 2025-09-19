"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UsageTable } from "./usage-table";
import { usageColumns } from "./usage-columns";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { 
  getFeedUsageAction, 
  createFeedUsageAction, 
  updateFeedUsageAction, 
  deleteFeedUsageAction 
} from "@/app/actions/feed-usage";
import { getFeedInventoryAction } from "@/app/actions/feed-inventory";
import { getFlocksAction } from "@/app/actions/flocks";

const feedUsageSchema = z.object({
  flockId: z.string().min(1, "Flock is required"),
  feedId: z.string().min(1, "Feed is required"),
  date: z.date(),
  amountUsed: z.number().min(0.1, "Amount must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  cost: z.number().min(0, "Cost must be positive").optional(),
  notes: z.string().optional(),
});

type FeedUsageFormData = z.infer<typeof feedUsageSchema>;

export function FeedUsage() {
  const [feedUsage, setFeedUsage] = useState<any[]>([]);
  const [flocks, setFlocks] = useState<any[]>([]);
  const [feedInventory, setFeedInventory] = useState<any[]>([]);
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

  const form = useForm<FeedUsageFormData>({
    resolver: zodResolver(feedUsageSchema),
    defaultValues: {
      flockId: "",
      feedId: "",
      date: new Date(),
      amountUsed: 0,
      unit: "kg",
      cost: 0,
      notes: "",
    },
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchFeedUsage();
    fetchFlocks();
    fetchFeedInventory();
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

  const fetchFlocks = async () => {
    try {
      const result = await getFlocksAction();
      if (result && result.success) {
        setFlocks(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching flocks:", error);
    }
  };

  const fetchFeedInventory = async () => {
    try {
      const result = await getFeedInventoryAction();
      if (result && result.success) {
        setFeedInventory(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching feed inventory:", error);
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
      form.reset();
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
    form.reset({
      flockId: item.flockId,
      feedId: item.feedId,
      date: new Date(item.date),
      amountUsed: item.amountUsed,
      unit: item.unit,
      cost: item.cost || 0,
      notes: item.notes || "",
    });
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
        toast.success("Feed usage record deleted successfully!", {
          description: `Record for ${item.flock?.batchCode || 'Unknown Flock'} has been removed`,
        });
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

  const totalUsage = feedUsage.reduce((sum, item) => sum + item.amountUsed, 0);
  const totalCost = feedUsage.reduce((sum, item) => sum + (item.cost || 0), 0);
  const averageDailyUsage = feedUsage.length > 0 
    ? totalUsage / new Set(feedUsage.map(item => new Date(item.date).toDateString())).size 
    : 0;


  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">
              {feedUsage.length} records
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageDailyUsage.toFixed(1)} kg</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Flocks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(feedUsage.map(item => item.flockId)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Feed Usage Tracking</CardTitle>
              <CardDescription>
                Track daily feed consumption per flock and monitor feeding patterns.
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingItem(null);
                  form.reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Usage
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Edit Feed Usage" : "Record Feed Usage"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingItem 
                      ? "Update the feed usage record below."
                      : "Record a new feed usage for a flock."
                    }
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="flockId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Flock</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select flock" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {flocks.map((flock) => (
                                  <SelectItem key={flock.id} value={flock.id}>
                                    {flock.batchCode} ({flock.breed} - {flock.currentCount} birds)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="feedId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Feed</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select feed" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {feedInventory.map((feed) => (
                                  <SelectItem key={feed.id} value={feed.id}>
                                    {feed.feedType} ({feed.unit})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <Input 
                                type="date"
                                {...field}
                                value={field.value ? field.value.toISOString().split('T')[0] : ''}
                                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : new Date())}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="amountUsed"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount Used</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1"
                                placeholder="0.0" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit</FormLabel>
                            <FormControl>
                              <Input placeholder="kg" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Additional notes about this feeding..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : editingItem ? "Update" : "Record"} Usage
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
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

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Feed Usage Record Details</DialogTitle>
            <DialogDescription>
              Detailed information about the feed usage record
            </DialogDescription>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Flock</Label>
                  <p className="text-sm font-medium">{viewingItem.flock?.batchCode || "Unknown"}</p>
                  <Badge variant="outline" className="mt-1">
                    {viewingItem.flock?.breed || "Unknown"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Feed Type</Label>
                  <p className="text-sm font-medium">{viewingItem.feed?.feedType || "Unknown"}</p>
                  <Badge variant="outline" className="mt-1">
                    {viewingItem.feed?.feedType || "Unknown"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                  <p className="text-sm font-medium">{new Date(viewingItem.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Amount Used</Label>
                  <p className="text-sm font-medium">{viewingItem.amountUsed} {viewingItem.unit}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Cost</Label>
                  <p className="text-sm font-medium">
                    {viewingItem.cost ? `${viewingItem.cost.toFixed(2)} ETB` : "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Recorded By</Label>
                  <p className="text-sm font-medium">{viewingItem.recordedBy?.name || "Unknown"}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded-md">{viewingItem.notes || "N/A"}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              handleEdit(viewingItem);
            }}>
              Edit Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={
          confirmDialog.type === 'delete'
            ? 'Delete Feed Usage Record'
            : 'Confirm Action'
        }
        desc={
          confirmDialog.type === 'delete'
            ? `Are you sure you want to delete the feed usage record for ${confirmDialog.item?.flock?.batchCode || 'Unknown Flock'}? This action cannot be undone and the record will be permanently removed.`
            : 'Are you sure you want to proceed?'
        }
        confirmText={
          confirmDialog.type === 'delete'
            ? 'Delete Record'
            : 'Continue'
        }
        cancelBtnText="Cancel"
        destructive={confirmDialog.type === 'delete'}
        handleConfirm={handleConfirmAction}
        isLoading={actionLoading === confirmDialog.item?.id}
      />
    </div>
  );
}
