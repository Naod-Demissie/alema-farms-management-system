"use client";

import React, { useState, useEffect } from "react";
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
} from "@/app/actions/feed-suppliers";

const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export function FeedSuppliers() {
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
          toast.success("Supplier updated successfully!");
        } else {
          toast.error("Failed to update supplier", {
            description: result.error || "An unexpected error occurred",
          });
          return;
        }
      } else {
        // Add new supplier
        result = await createFeedSupplierAction(data);
        if (result.success) {
          toast.success("Supplier created successfully!");
        } else {
          toast.error("Failed to create supplier", {
            description: result.error || "An unexpected error occurred",
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
      toast.error("Failed to save supplier", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
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
        toast.success("Supplier deleted successfully!", {
          description: `Supplier ${supplier.name} has been removed`,
        });
        await fetchSuppliers();
      } else {
        toast.error("Failed to delete supplier", {
          description: result.error || "An unexpected error occurred",
        });
      }
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast.error("Failed to delete supplier", {
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

  const activeSuppliers = suppliers.filter(supplier => supplier.isActive);
  const inactiveSuppliers = suppliers.filter(supplier => !supplier.isActive);


  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeSuppliers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{inactiveSuppliers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Contact Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suppliers.filter(s => s.phone).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Feed Suppliers</CardTitle>
              <CardDescription>
                Manage your feed suppliers and their contact information.
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingSupplier(null);
                  form.reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Supplier
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingSupplier 
                      ? "Update the supplier information below."
                      : "Add a new feed supplier to your system."
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
                            <FormLabel>Supplier Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter supplier name" {...field} />
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
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
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
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
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

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingSupplier ? "Update" : "Add"} Supplier
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
              columns={supplierColumns(handleView, handleEdit, handleDeleteClick, getStatusBadge)}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Supplier Details</DialogTitle>
            <DialogDescription>
              Detailed information about the supplier
            </DialogDescription>
          </DialogHeader>
          {viewingSupplier && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Supplier Name</Label>
                  <p className="text-sm font-medium">{viewingSupplier.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Contact Person</Label>
                  <p className="text-sm font-medium">{viewingSupplier.contactName || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                  <p className="text-sm font-medium">{viewingSupplier.phone || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(viewingSupplier.isActive)}</div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded-md">{viewingSupplier.address || "N/A"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded-md">{viewingSupplier.notes || "N/A"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
                  <p className="text-sm font-medium">{new Date(viewingSupplier.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Updated At</Label>
                  <p className="text-sm font-medium">{new Date(viewingSupplier.updatedAt).toLocaleString()}</p>
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
              handleEdit(viewingSupplier);
            }}>
              Edit Supplier
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
            ? 'Delete Supplier'
            : 'Confirm Action'
        }
        desc={
          confirmDialog.type === 'delete'
            ? `Are you sure you want to delete the supplier "${confirmDialog.supplier?.name}"? This action cannot be undone and the supplier will be permanently removed.`
            : 'Are you sure you want to proceed?'
        }
        confirmText={
          confirmDialog.type === 'delete'
            ? 'Delete Supplier'
            : 'Continue'
        }
        cancelBtnText="Cancel"
        destructive={confirmDialog.type === 'delete'}
        handleConfirm={handleConfirmAction}
        isLoading={actionLoading === confirmDialog.supplier?.id}
      />
    </div>
  );
}
