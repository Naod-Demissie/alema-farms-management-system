"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, AlertTriangle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { InventoryTable } from "./inventory-table";
import { inventoryColumns } from "./inventory-columns";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Switch } from "@/components/ui/switch";
import { 
  getFeedInventoryAction, 
  createFeedInventoryAction, 
  updateFeedInventoryAction, 
  deleteFeedInventoryAction 
} from "@/app/(dashboard)/feed/server/feed-inventory";
import { getFeedSuppliersAction, createFeedSupplierAction } from "@/app/(dashboard)/feed/server/feed-suppliers";
import { feedTypeLabels } from "@/app/(dashboard)/feed/utils/feed-program";
import { createExpense, deleteExpenseBySource } from "@/app/(dashboard)/financial/server/financial";
import { ExpenseCategory } from "@/lib/generated/prisma/enums";

const feedInventorySchema = z.object({
  feedType: z.enum(["LAYER_STARTER", "REARING", "PULLET_FEED", "LAYER", "LAYER_PHASE_1", "CUSTOM"]),
  supplierId: z.string().optional(),
  quantity: z.number().min(0, "Quantity must be positive"),
  unit: z.enum(["KG", "QUINTAL"]),
  costPerUnit: z.number().min(0, "Cost must be positive").optional(),
  notes: z.string().optional(),
  // Supplier fields (when creating new supplier)
  supplierName: z.string().optional(),
  supplierContactName: z.string().optional(),
  supplierPhone: z.string().optional(),
  supplierAddress: z.string().optional(),
  supplierNotes: z.string().optional(),
});

type FeedInventoryFormData = z.infer<typeof feedInventorySchema>;

export function FeedInventory() {
  const t = useTranslations('feed.inventory');
  const tCommon = useTranslations('feed.common');
  const tFeedTypes = useTranslations('feed.feedTypes');
  const [inventory, setInventory] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addToSuppliers, setAddToSuppliers] = useState(false);
  const [addToExpense, setAddToExpense] = useState(true);
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
      supplierName: "",
      supplierContactName: "",
      supplierPhone: "",
      supplierAddress: "",
      supplierNotes: "",
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
      // Validate supplier name if "Add to Suppliers" is enabled
      if (addToSuppliers && !data.supplierName && !editingItem) {
        toast.error("Supplier name is required when 'Add Suppliers' is enabled");
        return;
      }

      setLoading(true);
      let result;
      let actualSupplierId = data.supplierId;
      
      // If "Add to Suppliers" is enabled and supplier fields are filled
      if (addToSuppliers && data.supplierName && !editingItem) {
        // Create a new supplier first
        const supplierResult = await createFeedSupplierAction({
          name: data.supplierName,
          contactName: data.supplierContactName,
          phone: data.supplierPhone,
          address: data.supplierAddress,
          notes: data.supplierNotes,
        });
        
        if (supplierResult.success && supplierResult.data) {
          actualSupplierId = supplierResult.data.id;
          toast.success("Supplier created successfully");
          // Refresh suppliers list
          await fetchSuppliers();
        } else {
          toast.error("Failed to create supplier", {
            description: supplierResult.error || "Unknown error",
          });
          // Continue with inventory creation even if supplier creation fails
        }
      }
      
      if (editingItem) {
        // Update existing item
        result = await updateFeedInventoryAction(editingItem.id, {
          feedType: data.feedType,
          supplierId: actualSupplierId === "none" ? undefined : actualSupplierId,
          quantity: data.quantity,
          unit: data.unit,
          costPerUnit: data.costPerUnit,
          notes: data.notes,
        });
        if (result.success) {
          toast.success(t('toasts.updated'));
        } else {
          toast.error(t('toasts.updateError'), {
            description: result.error || t('toasts.unexpectedError'),
          });
          return;
        }
      } else {
        // Add new item
        result = await createFeedInventoryAction({
          feedType: data.feedType,
          supplierId: actualSupplierId === "none" ? undefined : actualSupplierId,
          quantity: data.quantity,
          unit: data.unit,
          costPerUnit: data.costPerUnit,
          notes: data.notes,
        });
        if (result.success) {
          toast.success(t('toasts.created'));
          
          // If "Add to Expense Table" is enabled
          if (addToExpense && data.costPerUnit && data.quantity && result.data) {
            // Calculate total amount: quantity * costPerUnit
            // costPerUnit is per the selected unit (KG or Quintal)
            const totalAmount = data.quantity * data.costPerUnit;
            const expenseResult = await createExpense({
              category: ExpenseCategory.feed,
              quantity: data.quantity, // Store quantity in the selected unit
              costPerQuantity: data.costPerUnit,
              amount: totalAmount,
              date: new Date(),
              description: `Feed inventory: ${feedTypeLabels[data.feedType]} - ${data.quantity} ${data.unit}${data.notes ? ` - ${data.notes}` : ''}`,
              sourceId: result.data.id,
              sourceType: 'feed_inventory',
            });
            
            if (expenseResult.success) {
              toast.success("Expense record created successfully");
            } else {
              toast.warning("Inventory created but expense recording failed", {
                description: expenseResult.message || "Unknown error",
              });
            }
          }
        } else {
          toast.error(t('toasts.createError'), {
            description: result.error || t('toasts.unexpectedError'),
          });
          return;
        }
      }
      
      await fetchInventory();
      setIsAddDialogOpen(false);
      setEditingItem(null);
      setAddToSuppliers(false);
      setAddToExpense(true);
      form.reset();
    } catch (error) {
      console.error("Error saving inventory item:", error);
      toast.error(t('toasts.createError'), {
        description: error instanceof Error ? error.message : t('toasts.unexpectedError'),
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
      // First, try to delete the corresponding expense record
      const expenseDeleteResult = await deleteExpenseBySource(item.id, 'feed_inventory');
      
      if (expenseDeleteResult.success && expenseDeleteResult.message !== "No linked expense found") {
        toast.success("Linked expense record also deleted");
      } else if (!expenseDeleteResult.success) {
        console.warn("Failed to delete linked expense:", expenseDeleteResult.message);
        toast.warning("Inventory will be deleted, but expense record could not be removed");
      }

      // Now delete the inventory item
      const result = await deleteFeedInventoryAction(item.id);
      
      if (result.success) {
        toast.success(t('toasts.deleted'), {
          description: `${tFeedTypes(item.feedType, { defaultValue: item.feedType })} ${t('feedType')} ${tCommon('deleteRecord')}`,
        });
        await fetchInventory();
      } else {
        toast.error(t('toasts.deleteError'), {
          description: result.error || t('toasts.unexpectedError'),
        });
      }
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      toast.error(t('toasts.deleteError'), {
        description: error instanceof Error ? error.message : t('toasts.unexpectedError'),
      });
    } finally {
      setActionLoading(null);
    }
  };


  // Utility function to format numbers with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const lowStockItems = []; // No longer tracking low stock


  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cards.totalStock')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="text-2xl font-bold">{inventory.length}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cards.lowStock')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold text-orange-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-orange-600">{lowStockItems.length}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cards.totalValue')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(inventory.reduce((sum, item) => {
                  // Calculate total value: quantity * costPerUnit
                  // costPerUnit is per the selected unit (KG or Quintal)
                  return sum + (item.quantity * (item.costPerUnit || 0));
                }, 0))} {tCommon('birr')}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cards.activeItems')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="text-2xl font-bold">
                {inventory.filter(item => item.isActive).length}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>{t('table.title')}</CardTitle>
              <CardDescription>
                {t('table.description')}
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingItem(null);
                  setAddToSuppliers(false);
                  setAddToExpense(true);
                  form.reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addInventory')}
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto sm:w-full">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? t('dialog.editTitle') : t('dialog.addTitle')}
                  </DialogTitle>
                  <DialogDescription>
                    {editingItem 
                      ? t('dialog.editDescription')
                      : t('dialog.addDescription')
                    }
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Toggles - Only show when adding new inventory */}
                    {!editingItem && (
                      <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-border">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="space-y-0.5">
                            <Label htmlFor="add-supplier" className="text-base font-medium">
                              Add Suppliers
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Create a new supplier along with this inventory
                            </p>
                          </div>
                          <Switch
                            id="add-supplier"
                            checked={addToSuppliers}
                            onCheckedChange={setAddToSuppliers}
                            className="sm:ml-4"
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="space-y-0.5">
                            <Label htmlFor="add-expense" className="text-base font-medium">
                              Add to Expense Table
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Record this purchase as a feed expense
                            </p>
                          </div>
                          <Switch
                            id="add-expense"
                            checked={addToExpense}
                            onCheckedChange={setAddToExpense}
                            className="sm:ml-4"
                          />
                        </div>
                      </div>
                    )}

                    {/* First row: Feed Type and Supplier */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="feedType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              {t('form.feedTypeLabel')} <span className="text-red-500">*</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder={t('form.feedTypePlaceholder')} />
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
                            <FormLabel>{t('form.supplierLabel')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder={t('form.supplierPlaceholder')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">{t('noSupplier')}</SelectItem>
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
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-1">
                            <FormLabel className="flex items-center gap-1">
                              {t('form.quantityLabel')} <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                className="w-full"
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value === "" ? 0 : parseFloat(value) || 0);
                                }}
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
                          <FormItem className="sm:col-span-1">
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
                          <FormItem className="sm:col-span-2">
                            <FormLabel className="flex items-center gap-1">
                              Cost per {form.watch('unit') === 'QUINTAL' ? 'Quintal' : 'KG'} ({tCommon('birr')}) <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="0.00" 
                                className="w-full"
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value === "" ? 0 : parseFloat(value) || 0);
                                }}
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
                          {(form.watch('quantity') ?? 0) > 0 && (form.watch('costPerUnit') ?? 0) > 0 && form.watch('unit')
                            ? new Intl.NumberFormat("en-ET", {
                                style: "currency",
                                currency: "ETB",
                              }).format(
                                // Calculate total cost: quantity * costPerUnit
                                // costPerUnit is per the selected unit (KG or Quintal)
                                (form.watch('quantity') ?? 0) * (form.watch('costPerUnit') ?? 0)
                              )
                            : `0.00 ${tCommon('birr')}`
                          }
                        </div>
                        {(form.watch('quantity') ?? 0) > 0 && (form.watch('costPerUnit') ?? 0) > 0 && form.watch('unit') && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {form.watch('quantity')} {form.watch('unit')} × {new Intl.NumberFormat("en-ET", {
                              style: "currency",
                              currency: "ETB",
                            }).format(form.watch('costPerUnit') ?? 0)} per {form.watch('unit') === 'QUINTAL' ? 'Quintal' : 'KG'}
                          </div>
                        )}
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('form.notesLabel')}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={t('form.notesPlaceholder')}
                              className="w-full"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Supplier Fields - Only show when "Add Suppliers" toggle is on */}
                    {addToSuppliers && !editingItem && (
                      <div className="space-y-4 p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold text-primary">New Supplier Information</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="supplierName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-1">
                                  Supplier Name <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter supplier name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="supplierContactName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contact Person</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter contact person name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="supplierPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="+251 XXX XXX XXX" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="supplierAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter supplier address..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="supplierNotes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Supplier Notes</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Additional notes about this supplier..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="w-full sm:w-auto">
                        {t('form.cancelButton')}
                      </Button>
                      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingItem ? t('form.updateButton') : t('form.submitButton')}
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
              columns={inventoryColumns(handleView, handleEdit, handleDeleteClick, t, tCommon, tFeedTypes)}
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
        <DialogContent className="w-[95vw] max-w-2xl sm:w-full">
          <DialogHeader>
            <DialogTitle>{t('dialog.viewTitle')}</DialogTitle>
            <DialogDescription>
              Detailed information about the inventory item
            </DialogDescription>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    {viewingItem.costPerUnit ? `${formatNumber(viewingItem.costPerUnit)} ${tCommon('birr')}` : "N/A"}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded-md">{viewingItem.notes || "N/A"}</p>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="w-full sm:w-auto">
              Close
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              handleEdit(viewingItem);
            }} className="w-full sm:w-auto">
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
            ? `Are you sure you want to delete this feed inventory item? This action cannot be undone.`
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
