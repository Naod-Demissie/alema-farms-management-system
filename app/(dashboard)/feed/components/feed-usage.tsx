"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, TrendingUp, CheckCircle, XCircle, Loader2 } from "lucide-react";
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
import { getFeedRecommendationsAction } from "@/app/actions/feed-program";
// import { getStaffAction } from "@/app/actions/staff";
import { feedTypeLabels, feedTypeColors } from "@/lib/feed-program";
import { useSession } from "@/lib/auth-client";

const feedUsageSchema = z.object({
  flockId: z.string().min(1, "Flock is required"),
  feedId: z.string().min(1, "Feed is required"),
  date: z.date(),
  amountUsed: z.number().min(0.1, "Amount must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  notes: z.string().optional(),
});

type FeedUsageFormData = z.infer<typeof feedUsageSchema>;

export function FeedUsage() {
  const { data: session } = useSession();
  const currentUser = session?.user;
  
  const [feedUsage, setFeedUsage] = useState<any[]>([]);
  const [flocks, setFlocks] = useState<any[]>([]);
  const [feedInventory, setFeedInventory] = useState<any[]>([]);
  const [feedRecommendations, setFeedRecommendations] = useState<any[]>([]);
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
  const [selectedFlockId, setSelectedFlockId] = useState<string>("");
  const [recommendation, setRecommendation] = useState<any>(null);

  const form = useForm<FeedUsageFormData>({
    resolver: zodResolver(feedUsageSchema),
    defaultValues: {
      flockId: "",
      feedId: "",
      date: new Date(),
      amountUsed: 0,
      unit: "kg",
      notes: "",
    },
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchFeedUsage();
    fetchFlocks();
    fetchFeedInventory();
    fetchFeedRecommendations();
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

  const fetchFeedRecommendations = async () => {
    try {
      const result = await getFeedRecommendationsAction();
      if (result && result.success) {
        setFeedRecommendations(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching feed recommendations:", error);
    }
  };


  const handleFlockChange = (flockId: string) => {
    setSelectedFlockId(flockId);
    const flockRecommendation = feedRecommendations.find(rec => rec.flock.id === flockId);
    setRecommendation(flockRecommendation?.recommendation || null);
    
    if (flockRecommendation) {
      // Find matching feed in inventory
      const matchingFeed = feedInventory.find(feed => 
        feed.feedType === flockRecommendation.recommendation.feedType && feed.isActive
      );
      
      if (matchingFeed) {
        form.setValue('feedId', matchingFeed.id);
        form.setValue('amountUsed', flockRecommendation.recommendation.totalAmountKg);
      }
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
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader className="pb-2">
                  <DialogTitle className="text-lg font-semibold">
                    {editingItem ? "Edit Feed Usage" : "Record Feed Usage"}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    {editingItem 
                      ? "Update the feed usage record below."
                      : "Record a new feed usage for a flock."
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Flock and Feed Selection */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="flockId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Flock</FormLabel>
                              <Select onValueChange={(value) => {
                                field.onChange(value);
                                handleFlockChange(value);
                              }} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select flock" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {flocks.map((flock) => {
                                    const flockRec = feedRecommendations.find(rec => rec.flock.id === flock.id);
                                    return (
                                      <SelectItem key={flock.id} value={flock.id}>
                                        <div className="flex items-center justify-between w-full">
                                          <span className="truncate">{flock.batchCode} ({flock.breed} - {flock.currentCount} birds)</span>
                                          {flockRec && (
                                            <Badge className={`ml-2 ${feedTypeColors[flockRec.recommendation.feedType as keyof typeof feedTypeColors]}`}>
                                              {feedTypeLabels[flockRec.recommendation.feedType as keyof typeof feedTypeLabels]}
                                            </Badge>
                                          )}
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Feed Program Recommendation */}
                    {recommendation && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-blue-900 dark:text-blue-100 text-sm">Feed Program Recommendation</h4>
                          <Badge className={`${feedTypeColors[recommendation.feedType as keyof typeof feedTypeColors]} text-xs`}>
                            {feedTypeLabels[recommendation.feedType as keyof typeof feedTypeLabels]}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-xs mb-2">
                          <div>
                            <span className="text-blue-700 dark:text-blue-300 font-medium">Age:</span>
                            <div className="text-blue-900 dark:text-blue-100">{recommendation.ageInWeeks} weeks ({recommendation.ageInDays} days)</div>
                          </div>
                          <div>
                            <span className="text-blue-700 dark:text-blue-300 font-medium">Per hen:</span>
                            <div className="text-blue-900 dark:text-blue-100">{recommendation.gramPerHen}g</div>
                          </div>
                          <div>
                            <span className="text-blue-700 dark:text-blue-300 font-medium">Total:</span>
                            <div className="text-blue-900 dark:text-blue-100 font-semibold">{recommendation.totalAmountKg.toFixed(1)}kg</div>
                          </div>
                        </div>
                        {recommendation.isTransitionWeek && (
                          <div className="mb-2 p-2 bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded text-orange-800 dark:text-orange-200 text-xs">
                            ⚠️ Feed change next week to {feedTypeLabels[recommendation.nextFeedType as keyof typeof feedTypeLabels]}
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full h-8 text-xs"
                          onClick={() => {
                            form.setValue('amountUsed', recommendation.totalAmountKg);
                          }}
                        >
                          Use Recommendation
                        </Button>
                      </div>
                    )}

                    {/* Usage Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm font-medium">Date</FormLabel>
                            <FormControl>
                              <Input 
                                type="date"
                                className="h-9"
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
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm font-medium">Amount Used</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1"
                                placeholder="0.0"
                                className="h-9"
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
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm font-medium">Unit</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="kg" 
                                className="h-9"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Optional Information */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-medium">Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Additional notes about this feeding..."
                              className="min-h-[60px] resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter className="pt-3 border-t">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsAddDialogOpen(false)}
                          className="px-4 h-9"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={loading}
                          className="px-4 h-9"
                        >
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {editingItem ? "Update Usage" : "Record Usage"}
                        </Button>
                      </div>
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
                    <p className="text-sm font-medium">{new Date(viewingItem.date).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Amount Used</Label>
                    <p className="text-sm font-medium">{viewingItem.amountUsed} {viewingItem.unit}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Recorded By</Label>
                    <p className="text-sm font-medium">
                      {viewingItem.recordedBy?.name || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Recorded By</Label>
                    <p className="text-sm font-medium">{viewingItem.recordedBy?.name || "Unknown"}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Recorded At</Label>
                    <p className="text-sm font-medium">
                      {new Date(viewingItem.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {viewingItem.notes && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm">{viewingItem.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="pt-4 border-t">
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsViewDialogOpen(false)}
                className="px-6"
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  setIsViewDialogOpen(false);
                  handleEdit(viewingItem);
                }}
                className="px-6"
              >
                Edit Record
              </Button>
            </div>
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
