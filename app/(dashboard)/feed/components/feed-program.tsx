"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, TrendingUp, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { 
  getFeedProgramAction, 
  createFeedProgramAction, 
  updateFeedProgramAction, 
  deleteFeedProgramAction 
} from "@/app/actions/feed-program";
import { feedTypeLabels, feedTypeColors } from "@/lib/feed-program";
import { ProgramTable } from "./program-table";
import { programColumns } from "./program-columns";

const breedLabels = {
  broiler: "Broiler",
  layer: "Layer",
  dual_purpose: "Dual Purpose"
};

const feedProgramSchema = z.object({
  breed: z.enum(['broiler', 'layer', 'dual_purpose']),
  ageInWeeks: z.number().min(1, "Age in weeks must be at least 1"),
  ageInDays: z.string().min(1, "Age in days is required"),
  feedType: z.enum(["LAYER_STARTER", "REARING", "PULLET_FEED", "LAYER", "LAYER_PHASE_1", "CUSTOM"]),
  gramPerHen: z.number().min(0.1, "Grams per hen must be greater than 0"),
});

type FeedProgramFormData = z.infer<typeof feedProgramSchema>;

export function FeedProgram() {
  const [program, setProgram] = useState<any[]>([]);
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

  const form = useForm<FeedProgramFormData>({
    resolver: zodResolver(feedProgramSchema),
    defaultValues: {
      breed: "layer",
      ageInWeeks: 1,
      ageInDays: "1-7",
      feedType: "LAYER_STARTER",
      gramPerHen: 10,
    },
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchProgram();
  }, []);

  const fetchProgram = async () => {
    try {
      setLoading(true);
      const result = await getFeedProgramAction();
      if (result && result.success) {
        setProgram(result.data || []);
      } else {
        console.error("Failed to fetch feed program:", result?.error || "Unknown error");
        setProgram([]);
      }
    } catch (error) {
      console.error("Error fetching feed program:", error);
      setProgram([]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FeedProgramFormData) => {
    try {
      setLoading(true);
      let result;
      
      if (editingItem) {
        // Update existing item
        result = await updateFeedProgramAction(editingItem.id, data);
        if (result.success) {
          toast.success("Feed program entry updated successfully!");
        } else {
          toast.error("Failed to update feed program entry", {
            description: result.error || "An unexpected error occurred",
          });
          return;
        }
      } else {
        // Add new item
        result = await createFeedProgramAction(data);
        if (result.success) {
          toast.success("Feed program entry created successfully!");
        } else {
          toast.error("Failed to create feed program entry", {
            description: result.error || "An unexpected error occurred",
          });
          return;
        }
      }
      
      await fetchProgram();
      setIsAddDialogOpen(false);
      setEditingItem(null);
      form.reset();
    } catch (error) {
      console.error("Error saving feed program entry:", error);
      toast.error("Failed to save feed program entry", {
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
      breed: item.breed,
      ageInWeeks: item.ageInWeeks,
      ageInDays: item.ageInDays,
      feedType: item.feedType,
      gramPerHen: item.gramPerHen,
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

  const handleDelete = (item: any) => {
    handleDeleteClick(item);
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.type) return;

    if (confirmDialog.type === 'delete' && confirmDialog.item) {
      await executeDeleteItem(confirmDialog.item);
    }

    setConfirmDialog({
      open: false,
      type: null,
      item: null,
    });
  };

  const executeDeleteItem = async (item: any) => {
    setActionLoading(item.id);
    try {
      const result = await deleteFeedProgramAction(item.id);
      
      if (result.success) {
        toast.success("Feed program entry deleted successfully!", {
          description: `${breedLabels[item.breed as keyof typeof breedLabels]} week ${item.ageInWeeks} has been removed`,
        });
        await fetchProgram();
      } else {
        toast.error("Failed to delete feed program entry", {
          description: result.error || "An unexpected error occurred",
        });
      }
    } catch (error) {
      console.error("Error deleting feed program entry:", error);
      toast.error("Failed to delete feed program entry", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setActionLoading(null);
    }
  };


  return (
    <div className="space-y-6">
      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Feed Program Management</CardTitle>
              <CardDescription>
                Manage feeding schedules and programs for different breeds and ages.
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingItem(null);
                  form.reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Program Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Edit Feed Program Entry" : "Add New Feed Program Entry"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingItem 
                      ? "Update the feed program entry details below."
                      : "Add a new feed program entry for a specific breed and age."
                    }
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="breed"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Breed</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select breed" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(breedLabels).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
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
                        name="ageInWeeks"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age in Weeks</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="1" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="ageInDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age in Days (Range)</FormLabel>
                            <FormControl>
                              <Input placeholder="1-7" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="gramPerHen"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Grams per Hen</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1"
                                placeholder="10.0" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="feedType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Feed Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select feed type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(feedTypeLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : editingItem ? "Update" : "Add"} Entry
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
                <p className="mt-2 text-sm text-muted-foreground">Loading feed program...</p>
              </div>
            </div>
          ) : (
            <ProgramTable
              columns={programColumns(handleView, handleEdit, handleDelete)}
              data={program}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Feed Program Entry Details</DialogTitle>
            <DialogDescription>
              Detailed information about the feed program entry
            </DialogDescription>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Breed</Label>
                  <p className="text-sm font-medium">
                    {breedLabels[viewingItem.breed as keyof typeof breedLabels]}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Age in Weeks</Label>
                  <p className="text-sm font-medium">{viewingItem.ageInWeeks}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Age in Days</Label>
                  <p className="text-sm font-medium">{viewingItem.ageInDays}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Feed Type</Label>
                  <div className="mt-1">
                    <Badge className={feedTypeColors[viewingItem.feedType as keyof typeof feedTypeColors]}>
                      {feedTypeLabels[viewingItem.feedType as keyof typeof feedTypeLabels]}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Grams per Hen</Label>
                  <p className="text-sm font-medium">{viewingItem.gramPerHen}g</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {viewingItem.isActive ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
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
              Edit Entry
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
            ? 'Delete Feed Program Entry'
            : 'Confirm Action'
        }
        desc={
          confirmDialog.type === 'delete'
            ? `Are you sure you want to delete the feed program entry for ${breedLabels[confirmDialog.item?.breed as keyof typeof breedLabels]} week ${confirmDialog.item?.ageInWeeks}? This action cannot be undone.`
            : 'Are you sure you want to proceed?'
        }
        confirmText={
          confirmDialog.type === 'delete'
            ? 'Delete Entry'
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
