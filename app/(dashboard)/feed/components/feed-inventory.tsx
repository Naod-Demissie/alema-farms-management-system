"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { InventoryTable } from "./inventory-table";
import { inventoryColumns } from "./inventory-columns";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { 
  getFeedInventoryAction, 
  createFeedInventoryAction, 
  updateFeedInventoryAction, 
  deleteFeedInventoryAction 
} from "@/app/actions/feed-inventory";
import { getFeedSuppliersAction } from "@/app/actions/feed-suppliers";

const feedTypeLabels = {
  LAYER_STARTER: "Layer Starter",
  REARING: "Rearing",
  PULLET_FEED: "Pullet Feed",
  LAYER: "Layer",
  LAYER_PHASE_1: "Layer Phase 1",
  CUSTOM: "Custom"
};

const feedInventorySchema = z.object({
  feedType: z.enum(["LAYER_STARTER", "REARING", "PULLET_FEED", "LAYER", "LAYER_PHASE_1", "CUSTOM"]),
  supplierId: z.string().optional(),
  quantity: z.number().min(0, "Quantity must be positive"),
  unit: z.enum(["KG", "QUINTAL"]),
  costPerUnit: z.number().min(0, "Cost must be positive").optional(),
  notes: z.string().optional(),
});

type FeedInventoryFormData = z.infer<typeof feedInventorySchema>;

export function FeedInventory() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
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

  const form = useForm<FeedInventoryFormData>({
    resolver: zodResolver(feedInventorySchema),
    defaultValues: {
      feedType: "LAYER_STARTER",
      supplierId: "none",
      quantity: 0,
      unit: "KG",
      costPerUnit: 0,
      notes: "",
    },
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchInventory();
    fetchSuppliers();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const result = await getFeedInventoryAction();
      if (result && result.success) {
        setInventory(result.data || []);
      } else {
        console.error("Failed to fetch inventory:", result?.error || "Unknown error");
        setInventory([]);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const result = await getFeedSuppliersAction();
      if (result && result.success) {
        setSuppliers(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const onSubmit = async (data: FeedInventoryFormData) => {
    try {
      setLoading(true);
      let result;
      
      if (editingItem) {
        // Update existing item
        result = await updateFeedInventoryAction(editingItem.id, data);
        if (result.success) {
          toast.success("Inventory item updated successfully!");
        } else {
          toast.error("Failed to update inventory item", {
            description: result.error || "An unexpected error occurred",
          });
          return;
        }
      } else {
        // Add new item
        result = await createFeedInventoryAction(data);
        if (result.success) {
          toast.success("Inventory item created successfully!");
        } else {
          toast.error("Failed to create inventory item", {
            description: result.error || "An unexpected error occurred",
          });
          return;
        }
      }
      
      await fetchInventory();
      setIsAddDialogOpen(false);
      setEditingItem(null);
      form.reset();
    } catch (error) {
      console.error("Error saving inventory item:", error);
      toast.error("Failed to save inventory item", {
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
      feedType: item.feedType,
      supplierId: item.supplierId || "none",
      quantity: item.quantity,
      unit: item.unit,
      costPerUnit: item.costPerUnit || 0,
      minStock: item.minStock || 0,
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
      const result = await deleteFeedInventoryAction(item.id);
      
      if (result.success) {
        toast.success("Inventory item deleted successfully!", {
          description: `${feedTypeLabels[item.feedType as keyof typeof feedTypeLabels] || item.feedType} feed item has been removed`,
        });
        await fetchInventory();
      } else {
        toast.error("Failed to delete inventory item", {
          description: result.error || "An unexpected error occurred",
        });
      }
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      toast.error("Failed to delete inventory item", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const getStockStatus = (quantity: number) => {
    return (
      <Badge variant="outline" className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        In Stock
      </Badge>
    );
  };

  const lowStockItems = []; // No longer tracking low stock


  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${inventory.reduce((sum, item) => 
                sum + (item.quantity * (item.costPerUnit || 0)), 0
              ).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventory.filter(item => item.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Feed Inventory</CardTitle>
              <CardDescription>
                Manage your feed inventory, track stock levels, and monitor expiry dates.
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingItem(null);
                  form.reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feed
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Edit Feed Item" : "Add New Feed Item"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingItem 
                      ? "Update the feed item details below."
                      : "Add a new feed item to your inventory."
                    }
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* First row: Feed Type and Supplier */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="feedType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              Feed Type <span className="text-red-500">*</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="w-full">
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

                      <FormField
                        control={form.control}
                        name="supplierId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Supplier (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select a supplier" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">No supplier</SelectItem>
                                {suppliers.map((supplier) => (
                                  <SelectItem key={supplier.id} value={supplier.id}>
                                    {supplier.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Second row: Quantity, Unit, and Cost per Unit */}
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              Quantity <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                className="w-full"
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
                            <FormLabel className="flex items-center gap-1">
                              Unit <span className="text-red-500">*</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="KG">KG</SelectItem>
                                <SelectItem value="QUINTAL">Quintal</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="costPerUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              Cost per {form.watch('unit') === 'QUINTAL' ? 'Quintal' : 'KG'} (ETB) <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="0.00" 
                                className="w-full"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Total Amount Display */}
                    <div className="grid gap-2">
                      <div className="bg-muted/50 p-3 rounded-lg text-center">
                        <div className="text-sm text-muted-foreground mb-1">Total Amount</div>
                        <div className="text-xl font-semibold">
                          {form.watch('quantity') && form.watch('costPerUnit') 
                            ? new Intl.NumberFormat("en-ET", {
                                style: "currency",
                                currency: "ETB",
                              }).format(
                                // Calculate total cost: quantity * costPerUnit
                                // The costPerUnit is already per the selected unit (KG or Quintal)
                                form.watch('quantity') * form.watch('costPerUnit')
                              )
                            : "0.00 ETB"
                          }
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Additional notes about this feed item..."
                              className="w-full"
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
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingItem ? "Update" : "Add"} Feed Item
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading inventory...</p>
              </div>
            </div>
          ) : (
            <InventoryTable
              columns={inventoryColumns(handleView, handleEdit, handleDeleteClick, getStatusBadge)}
              data={inventory}
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
            <DialogTitle>Inventory Item Details</DialogTitle>
            <DialogDescription>
              Detailed information about the inventory item
            </DialogDescription>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Feed Type</Label>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {feedTypeLabels[viewingItem.feedType as keyof typeof feedTypeLabels] || viewingItem.feedType}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Supplier</Label>
                  <p className="text-sm font-medium">{viewingItem.supplier?.name || "No supplier"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Quantity</Label>
                  <p className="text-sm font-medium">{viewingItem.quantity} {viewingItem.unit}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Cost per Unit</Label>
                  <p className="text-sm font-medium">
                    {viewingItem.costPerUnit ? `${viewingItem.costPerUnit.toFixed(2)} ETB` : "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(viewingItem.isActive)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Stock Status</Label>
                  <div className="mt-1">{getStockStatus(viewingItem.quantity)}</div>
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
              Edit Item
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
            ? 'Delete Inventory Item'
            : 'Confirm Action'
        }
        desc={
          confirmDialog.type === 'delete'
            ? `Are you sure you want to delete the ${feedTypeLabels[confirmDialog.item?.feedType as keyof typeof feedTypeLabels] || confirmDialog.item?.feedType} feed inventory item? This action cannot be undone and the item will be permanently removed.`
            : 'Are you sure you want to proceed?'
        }
        confirmText={
          confirmDialog.type === 'delete'
            ? 'Delete Item'
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
