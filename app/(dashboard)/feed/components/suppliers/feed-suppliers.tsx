"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { SupplierTable } from "./supplier-table";
import { supplierColumns } from "./supplier-columns";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { 
  getFeedSuppliersAction, 
  createFeedSupplierAction, 
  updateFeedSupplierAction, 
  deleteFeedSupplierAction 
} from "@/app/(dashboard)/feed/server/feed-suppliers";

const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export function FeedSuppliers() {
  const t = useTranslations('feed.suppliers');
  const tCommon = useTranslations('common');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [viewingSupplier, setViewingSupplier] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | null;
    supplier: any | null;
  }>({
    open: false,
    type: null,
    supplier: null,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      contactName: "",
      phone: "",
      address: "",
      notes: "",
    },
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const result = await getFeedSuppliersAction();
      if (result && result.success) {
        setSuppliers(result.data || []);
      } else {
        console.error("Failed to fetch suppliers:", result?.error || "Unknown error");
        setSuppliers([]);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SupplierFormData) => {
    try {
      setLoading(true);
      let result;
      
      if (editingSupplier) {
        // Update existing supplier
        result = await updateFeedSupplierAction(editingSupplier.id, data);
        if (result.success) {
          toast.success(t('toasts.updated'));
        } else {
          toast.error(t('toasts.updateError'), {
            description: result.error || t('toasts.unexpectedError'),
          });
          return;
        }
      } else {
        // Add new supplier
        result = await createFeedSupplierAction(data);
        if (result.success) {
          toast.success(t('toasts.created'));
        } else{
          toast.error(t('toasts.createError'), {
            description: result.error || t('toasts.unexpectedError'),
          });
          return;
        }
      }
      
      await fetchSuppliers();
      setIsAddDialogOpen(false);
      setEditingSupplier(null);
      form.reset();
    } catch (error) {
      console.error("Error saving supplier:", error);
      toast.error(t('toasts.createError'), {
        description: error instanceof Error ? error.message : t('toasts.unexpectedError'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (supplier: any) => {
    setViewingSupplier(supplier);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    form.reset({
      name: supplier.name,
      contactName: supplier.contactName,
      phone: supplier.phone,
      address: supplier.address,
      notes: supplier.notes,
    });
    setIsAddDialogOpen(true);
  };

  const handleDeleteClick = (supplier: any) => {
    setConfirmDialog({
      open: true,
      type: 'delete',
      supplier: supplier,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.type) return;

    if (confirmDialog.type === 'delete' && confirmDialog.supplier) {
      await executeDeleteSupplier(confirmDialog.supplier);
    }

    setConfirmDialog({
      open: false,
      type: null,
      supplier: null,
    });
  };

  const executeDeleteSupplier = async (supplier: any) => {
    setActionLoading(supplier.id);
    try {
      const result = await deleteFeedSupplierAction(supplier.id);
      
      if (result.success) {
        toast.success(t('toasts.deleted'), {
          description: `${t('supplierName')} ${supplier.name} ${tCommon('deleteRecord')}`,
        });
        await fetchSuppliers();
      } else {
        toast.error(t('toasts.deleteError'), {
          description: result.error || t('toasts.unexpectedError'),
        });
      }
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast.error(t('toasts.deleteError'), {
        description: error instanceof Error ? error.message : t('toasts.unexpectedError'),
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        {t('viewDialog.activeStatus')}
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        <XCircle className="w-3 h-3 mr-1" />
        {t('viewDialog.inactiveStatus')}
      </Badge>
    );
  };

  const activeSuppliers = suppliers.filter(supplier => supplier.isActive);
  const inactiveSuppliers = suppliers.filter(supplier => !supplier.isActive);


  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cards.totalSuppliers')}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="text-2xl font-bold">{suppliers.length}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cards.activeSuppliers')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold text-green-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-green-600">{activeSuppliers.length}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cards.activeContracts')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold text-gray-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-gray-600">{inactiveSuppliers.length}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cards.recentOrders')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="text-2xl font-bold">
                {suppliers.filter(s => s.phone).length}
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
                  setEditingSupplier(null);
                  form.reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('editDialog.addButton')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingSupplier ? t('editDialog.editTitle') : t('editDialog.addTitle')}
                  </DialogTitle>
                  <DialogDescription>
                    {editingSupplier 
                      ? t('editDialog.editDescription')
                      : t('editDialog.addDescription')
                    }
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              {t('form.supplierNameLabel')} <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder={t('form.supplierNamePlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="contactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('form.contactPersonLabel')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('form.contactPersonPlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('form.phoneLabel')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('form.phonePlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('form.addressLabel')}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={t('form.addressPlaceholder')}
                              {...field}
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
                          <FormLabel>{t('form.notesLabel')}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={t('form.notesPlaceholder')}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        {t('editDialog.cancelButton')}
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingSupplier ? t('editDialog.updateButton') : t('editDialog.addButton')} {t('editDialog.addSupplierButton')}
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
                <p className="mt-2 text-sm text-muted-foreground">Loading suppliers...</p>
              </div>
            </div>
          ) : (
            <SupplierTable
              columns={supplierColumns(handleView, handleEdit, handleDeleteClick, getStatusBadge, t, tCommon)}
              data={suppliers}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('viewDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('viewDialog.description')}
            </DialogDescription>
          </DialogHeader>
          {viewingSupplier && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('viewDialog.supplierNameLabel')}</Label>
                  <p className="text-sm font-medium">{viewingSupplier.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('viewDialog.contactPersonLabel')}</Label>
                  <p className="text-sm font-medium">{viewingSupplier.contactName || tCommon('na')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('viewDialog.phoneLabel')}</Label>
                  <p className="text-sm font-medium">{viewingSupplier.phone || tCommon('na')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('viewDialog.statusLabel')}</Label>
                  <div className="mt-1">{getStatusBadge(viewingSupplier.isActive)}</div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">{t('viewDialog.addressLabel')}</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded-md">{viewingSupplier.address || tCommon('na')}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">{t('viewDialog.notesLabel')}</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded-md">{viewingSupplier.notes || tCommon('na')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('viewDialog.createdAtLabel')}</Label>
                  <p className="text-sm font-medium">{format(new Date(viewingSupplier.createdAt), "MMM dd, yyyy")}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('viewDialog.updatedAtLabel')}</Label>
                  <p className="text-sm font-medium">{format(new Date(viewingSupplier.updatedAt), "MMM dd, yyyy")}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              {t('viewDialog.closeButton')}
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              handleEdit(viewingSupplier);
            }}>
              {t('viewDialog.editButton')}
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
            ? t('confirmDialog.deleteTitle')
            : t('confirmDialog.confirmAction')
        }
        desc={
          confirmDialog.type === 'delete'
            ? t('confirmDialog.deleteDescription', { name: confirmDialog.supplier?.name || '' })
            : tCommon('confirmProceed')
        }
        confirmText={
          confirmDialog.type === 'delete'
            ? t('confirmDialog.confirmButton')
            : tCommon('continue')
        }
        cancelBtnText={t('confirmDialog.cancelButton')}
        destructive={confirmDialog.type === 'delete'}
        handleConfirm={handleConfirmAction}
        isLoading={actionLoading === confirmDialog.supplier?.id}
      />
    </div>
  );
}
