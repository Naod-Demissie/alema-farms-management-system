"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { 
  createFeedInventoryAction, 
  updateFeedInventoryAction 
} from "@/app/(dashboard)/feed/server/feed-inventory";
import { getFeedSuppliersAction, createFeedSupplierAction } from "@/app/(dashboard)/feed/server/feed-suppliers";
import { feedTypeLabels } from "@/app/(dashboard)/feed/utils/feed-program";
import { createExpense } from "@/app/(dashboard)/financial/server/financial";
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

interface FeedInventoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: FeedInventoryFormData) => Promise<void>;
  title?: string;
  description?: string;
  submitButtonText?: string;
  editingItem?: any;
}

export function FeedInventoryDialog({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  submitButtonText,
  editingItem
}: FeedInventoryDialogProps) {
  const t = useTranslations('feed.inventory');
  const tCommon = useTranslations('feed.common');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addToSuppliers, setAddToSuppliers] = useState(false);
  const [addToExpense, setAddToExpense] = useState(true);

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

  // Fetch suppliers on component mount
  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
    }
  }, [isOpen]);

  // Reset form when dialog opens/closes or editing item changes
  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        form.reset({
          feedType: editingItem.feedType,
          supplierId: editingItem.supplierId || "none",
          quantity: editingItem.quantity,
          unit: editingItem.unit,
          costPerUnit: editingItem.costPerUnit || 0,
          notes: editingItem.notes || "",
        });
        setAddToSuppliers(false);
        setAddToExpense(true);
      } else {
        form.reset();
        setAddToSuppliers(false);
        setAddToExpense(true);
      }
    }
  }, [isOpen, editingItem, form]);

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

  const handleSubmit = async (data: FeedInventoryFormData) => {
    if (onSubmit) {
      await onSubmit(data);
      return;
    }

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
            const totalAmount = data.quantity * data.costPerUnit;
            const expenseResult = await createExpense({
              category: ExpenseCategory.feed,
              quantity: data.quantity,
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
      
      onClose();
    } catch (error) {
      console.error("Error saving inventory item:", error);
      toast.error(t('toasts.createError'), {
        description: error instanceof Error ? error.message : t('toasts.unexpectedError'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle>
            {title || (editingItem ? t('dialog.editTitle') : t('dialog.addTitle'))}
          </DialogTitle>
          <DialogDescription>
            {description || (editingItem 
              ? t('dialog.editDescription')
              : t('dialog.addDescription')
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
                {t('form.cancelButton')}
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitButtonText || (editingItem ? t('form.updateButton') : t('form.submitButton'))}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
