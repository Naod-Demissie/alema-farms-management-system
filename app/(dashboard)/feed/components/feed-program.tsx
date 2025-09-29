"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, TrendingUp, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
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

const feedProgramSchema = z.object({
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
    setLoading(true);
    try {
      const result = await getFeedProgramAction();
      if (result.success) {
        setProgram(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch feed program");
      }
    } catch (error) {
      console.error("Error fetching feed program:", error);
      toast.error("Failed to fetch feed program");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.reset({
      ageInWeeks: 1,
      ageInDays: "1-7",
      feedType: "LAYER_STARTER",
      gramPerHen: 10,
    });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    form.reset({
      ageInWeeks: item.ageInWeeks,
      ageInDays: item.ageInDays,
      feedType: item.feedType,
      gramPerHen: item.gramPerHen,
    });
    setIsAddDialogOpen(true);
  };

  const handleView = (item: any) => {
    setViewingItem(item);
    setIsViewDialogOpen(true);
  };

  const handleDelete = (item: any) => {
    setConfirmDialog({
      open: true,
      type: 'delete',
      item: item,
    });
  };

  const handleSubmit = async (data: FeedProgramFormData) => {
    try {
      setLoading(true);
      let result;
      if (editingItem) {
        result = await updateFeedProgramAction(editingItem.id, data);
      } else {
        result = await createFeedProgramAction(data);
      }

      if (result.success) {
        toast.success(editingItem ? "Feed program updated successfully" : "Feed program created successfully");
        setIsAddDialogOpen(false);
        setEditingItem(null);
        form.reset();
        fetchProgram();
      } else {
        toast.error(result.error || "Failed to save feed program");
      }
    } catch (error) {
      console.error("Error saving feed program:", error);
      toast.error("Failed to save feed program");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (confirmDialog.type === 'delete' && confirmDialog.item) {
      setActionLoading(confirmDialog.item.id);
      try {
        const result = await deleteFeedProgramAction(confirmDialog.item.id);
        if (result.success) {
          toast.success("Feed program deleted successfully");
          fetchProgram();
        } else {
          toast.error(result.error || "Failed to delete feed program");
        }
      } catch (error) {
        console.error("Error deleting feed program:", error);
        toast.error("Failed to delete feed program");
      } finally {
        setActionLoading(null);
        setConfirmDialog({ open: false, type: null, item: null });
      }
    }
  };

  const columns = programColumns(handleView, handleEdit, handleDelete);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Feed Program Management
              </CardTitle>
              <CardDescription>
                Manage feed programs for different age groups and feed types
              </CardDescription>
            </div>
            <Button onClick={handleAdd} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Program
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ProgramTable
            columns={columns}
            data={program}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Feed Program" : "Add New Feed Program"}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the feed program details below." : "Add a new feed program to your system."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="ageInWeeks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age in Weeks</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Enter age in weeks"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ageInDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age Range (Days)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 1-7, 8-14"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        <SelectItem value="LAYER_STARTER">Layer Starter</SelectItem>
                        <SelectItem value="REARING">Rearing</SelectItem>
                        <SelectItem value="PULLET_FEED">Pullet Feed</SelectItem>
                        <SelectItem value="LAYER">Layer</SelectItem>
                        <SelectItem value="LAYER_PHASE_1">Layer Phase 1</SelectItem>
                        <SelectItem value="CUSTOM">Custom</SelectItem>
                      </SelectContent>
                    </Select>
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
                        min="0.1"
                        placeholder="Enter grams per hen"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0.1)}
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
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingItem ? "Update" : "Add"} Program
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Feed Program Details</DialogTitle>
            <DialogDescription>
              View details of the selected feed program
            </DialogDescription>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Age in Weeks</Label>
                  <p className="text-sm font-medium">{viewingItem.ageInWeeks}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Age Range</Label>
                  <p className="text-sm font-medium">{viewingItem.ageInDays}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Feed Type</Label>
                <div className="mt-1">
                  <Badge variant="outline" className={feedTypeColors[viewingItem.feedType as keyof typeof feedTypeColors] || "bg-gray-100 text-gray-800"}>
                    {feedTypeLabels[viewingItem.feedType as keyof typeof feedTypeLabels] || viewingItem.feedType}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Grams per Hen</Label>
                <p className="text-sm font-medium">{viewingItem.gramPerHen}g</p>
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
        title="Delete Feed Program"
        desc={`Are you sure you want to delete this feed program? This action cannot be undone.`}
        confirmText="Delete"
        cancelBtnText="Cancel"
        destructive={true}
        handleConfirm={handleConfirmAction}
        isLoading={actionLoading === confirmDialog.item?.id}
      />
    </div>
  );
}
