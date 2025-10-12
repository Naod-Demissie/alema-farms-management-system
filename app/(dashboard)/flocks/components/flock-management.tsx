"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReusableDialog } from "@/components/ui/reusable-dialog";
import { FlockForm, flockSchema } from "@/components/forms/dialog-forms";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { 
  Plus,
  Loader2,
  TrendingUp,
  TrendingDown,
  Users,
  Bird,
  AlertTriangle,
  Edit,
  CalendarIcon,
  Eye
} from "lucide-react";
import { 
  createFlock, 
  updateFlock, 
  deleteFlock, 
  generateBatchCode,
  Flock,
} from "@/app/(dashboard)/flocks/server/flocks";
import { FlockFormData } from "./flock-types";
import { format } from "date-fns";
import { FlockTable } from "./flock-table";
import { flockColumns } from "./flock-table-columns";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";



interface FlockManagementMergedProps {
  flocks: Flock[];
  onFlockCreated: (flock: Flock) => void;
  onFlockUpdated: (flock: Flock) => void;
  onFlockDeleted: (flockId: string) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export function FlockManagementMerged({
  flocks,
  onFlockCreated,
  onFlockUpdated,
  onFlockDeleted,
  onRefresh,
  loading: pageLoading = false
}: FlockManagementMergedProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingFlock, setEditingFlock] = useState<Flock | null>(null);
  const [viewingFlock, setViewingFlock] = useState<Flock | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    flock: null as Flock | null,
  });



  const handleCreateFlock = async (data: z.infer<typeof flockSchema>) => {
    try {
      setLoading(true);
      const result = await createFlock(data);
      
      if (result.success) {
        onFlockCreated(result.data);
        setIsCreateDialogOpen(false);
        toast.success("Flock created successfully!", {
          description: `Batch ${data.batchCode} has been added to your flocks.`
        });
      } else {
        toast.error("Failed to create flock", {
          description: result.message || "An unexpected error occurred."
        });
      }
    } catch (error) {
      console.error('Error creating flock:', error);
      toast.error("Failed to create flock", {
        description: "An unexpected error occurred. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditFlock = async (data: z.infer<typeof flockSchema>) => {
    if (!editingFlock) return;
    
    try {
      setLoading(true);
      const result = await updateFlock(editingFlock.id, data);
      
      if (result.success) {
        onFlockUpdated(result.data);
        setIsEditDialogOpen(false);
        setEditingFlock(null);
        toast.success("Flock updated successfully!", {
          description: `Batch ${data.batchCode} has been updated.`
        });
      } else {
        toast.error("Failed to update flock", {
          description: result.message || "An unexpected error occurred."
        });
      }
    } catch (error) {
      console.error('Error updating flock:', error);
      toast.error("Failed to update flock", {
        description: "An unexpected error occurred. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteFlock = (flockId: string) => {
    const flock = flocks.find(f => f.id === flockId);
    if (flock) {
      setConfirmDialog({
        open: true,
        flock: flock,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog.flock) return;
    
    try {
      setDeletingId(confirmDialog.flock.id);
      const result = await deleteFlock(confirmDialog.flock.id);
      
      if (result.success) {
        onFlockDeleted(confirmDialog.flock.id);
        setConfirmDialog({ open: false, flock: null });
        toast.success("Flock deleted successfully!", {
          description: `Batch ${confirmDialog.flock.batchCode} has been removed from your flocks.`
        });
      } else {
        toast.error("Failed to delete flock", {
          description: result.message || "An unexpected error occurred."
        });
      }
    } catch (error) {
      console.error('Error deleting flock:', error);
      toast.error("Failed to delete flock", {
        description: "An unexpected error occurred. Please try again."
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (flock: Flock) => {
    setEditingFlock(flock);
    setIsEditDialogOpen(true);
  };

  const handleViewClick = (flock: Flock) => {
    setViewingFlock(flock);
    setIsViewDialogOpen(true);
  };


  const handleGenerateBatchCode = async (breed: string) => {
    try {
      const result = await generateBatchCode(breed as any);
      if (result.success) {
        // The form value will be set by the FlockForm component
        return result.data.batchCode;
      }
    } catch (error) {
      console.error('Error generating batch code:', error);
    }
    return null;
  };

  // Calculate statistics
  const totalBirds = flocks.reduce((sum, flock) => sum + flock.currentCount, 0);
  const averageMortalityRate = flocks.length > 0 
    ? flocks.reduce((sum, flock) => {
        const totalMortality = flock.mortality?.reduce((sum, record) => sum + record.count, 0) || 0;
        const mortalityRate = flock.initialCount > 0 ? (totalMortality / flock.initialCount) * 100 : 0;
        return sum + mortalityRate;
      }, 0) / flocks.length
    : 0;
  const highRiskFlocks = flocks.filter(flock => {
    const totalMortality = flock.mortality?.reduce((sum, record) => sum + record.count, 0) || 0;
    const mortalityRate = flock.initialCount > 0 ? (totalMortality / flock.initialCount) * 100 : 0;
    return mortalityRate > 15;
  }).length;
  const healthyFlocks = flocks.filter(flock => {
    const totalMortality = flock.mortality?.reduce((sum, record) => sum + record.count, 0) || 0;
    const mortalityRate = flock.initialCount > 0 ? (totalMortality / flock.initialCount) * 100 : 0;
    return mortalityRate <= 5;
  }).length;

  const tableMeta = {
    onEdit: handleEditClick,
    onView: handleViewClick,
    onDelete: handleDeleteFlock,
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Birds</CardTitle>
            <Bird className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {pageLoading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {totalBirds.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all flocks
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Mortality</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {pageLoading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {averageMortalityRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all flocks
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Flocks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {pageLoading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {highRiskFlocks}
                </div>
                <p className="text-xs text-muted-foreground">
                  Mortality rate &gt; 15%
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy Flocks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {pageLoading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {healthyFlocks}
                </div>
                <p className="text-xs text-muted-foreground">
                  Mortality rate &le; 5%
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Flocks Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Flock Management ({flocks.length})</CardTitle>
              <CardDescription>
                Manage and track your poultry flocks with population monitoring
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Flock
                </Button>
              </DialogTrigger>
            </Dialog>
            
            <ReusableDialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
              config={{
                schema: flockSchema,
                defaultValues: {
                  batchCode: "",
                  arrivalDate: new Date(),
                  initialCount: 0,
                  currentCount: 0,
                  ageInDays: 0,
                  notes: "",
                },
                title: "Add New Flock",
                description: "Create a new flock with unique batch code and tracking information",
                submitText: "Create Flock",
                onSubmit: handleCreateFlock,
                maxWidth: "max-w-3xl",
                children: (form) => (
                  <FlockForm 
                    form={form} 
                    flocks={flocks}
                    onGenerateBatchCode={handleGenerateBatchCode}
                  />
                ),
              }}
              loading={loading}
            />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <FlockTable
            columns={flockColumns}
            data={flocks}
            toolbar={undefined}
            onEdit={handleEditClick}
            onView={handleViewClick}
            onDelete={handleDeleteFlock}
            loading={pageLoading || loading}
          />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <ReusableDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingFlock(null);
          }
        }}
        config={{
          schema: flockSchema,
          defaultValues: editingFlock ? {
            batchCode: editingFlock.batchCode,
            arrivalDate: new Date(editingFlock.arrivalDate),
            initialCount: editingFlock.initialCount,
            currentCount: editingFlock.currentCount,
            ageInDays: editingFlock.ageInDays || 0,
            notes: editingFlock.notes || "",
          } : {
            batchCode: "",
            arrivalDate: new Date(),
            initialCount: 0,
            currentCount: 0,
            ageInDays: 0,
            notes: "",
          },
          title: "Edit Flock",
          description: "Update flock information and tracking details",
          submitText: "Update Flock",
          onSubmit: handleEditFlock,
          maxWidth: "max-w-3xl",
          children: (form) => (
            <FlockForm 
              form={form} 
              flocks={flocks}
              onGenerateBatchCode={handleGenerateBatchCode}
            />
          ),
        }}
        loading={loading}
      />

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={(open) => {
        setIsViewDialogOpen(open);
        if (!open) {
          setViewingFlock(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Flock Details</DialogTitle>
            <DialogDescription>
              View detailed information for batch {viewingFlock?.batchCode}
            </DialogDescription>
          </DialogHeader>
          {viewingFlock && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Batch Code</label>
                  <div className="text-lg font-semibold">{viewingFlock.batchCode}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Arrival Date</label>
                  <div className="text-lg font-semibold">{format(new Date(viewingFlock.arrivalDate), 'MMM dd, yyyy')}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Initial Count</label>
                  <div className="text-lg font-semibold">{viewingFlock.initialCount.toLocaleString()}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Count</label>
                  <div className="text-lg font-semibold">{viewingFlock.currentCount.toLocaleString()}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Age at Arrival</label>
                  <div className="text-lg font-semibold">{viewingFlock.ageInDays || 0} days</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Age</label>
                  <div className="text-lg font-semibold">
                    {(() => {
                      const arrivalDate = new Date(viewingFlock.arrivalDate);
                      const ageAtArrival = viewingFlock.ageInDays || 0;
                      const today = new Date();
                      const daysSinceArrival = Math.floor((today.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24));
                      const totalAgeInDays = ageAtArrival + daysSinceArrival;
                      const weeks = Math.floor(totalAgeInDays / 7);
                      const days = totalAgeInDays % 7;
                      return `${weeks > 0 ? `${weeks}w ` : ''}${days}d (${totalAgeInDays} days)`;
                    })()}
                  </div>
                </div>
              </div>
              
              {viewingFlock.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <div className="text-sm bg-muted p-3 rounded-md mt-1">{viewingFlock.notes}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Population Change</label>
                  <div className="text-lg font-semibold">
                    {(() => {
                      const change = viewingFlock.currentCount - viewingFlock.initialCount;
                      const percentage = (change / viewingFlock.initialCount) * 100;
                      return (
                        <div className="flex items-center space-x-1">
                          {change > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : change < 0 ? (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          ) : null}
                          <span className={change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : ''}>
                            {change > 0 ? '+' : ''}{change.toLocaleString()}
                          </span>
                          <span className="text-muted-foreground">
                            ({percentage > 0 ? '+' : ''}{percentage.toFixed(1)}%)
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Mortality Rate</label>
                  <div className="text-lg font-semibold">
                    {(() => {
                      const totalMortality = viewingFlock.mortality?.reduce((sum, record) => sum + record.count, 0) || 0;
                      const mortalityRate = viewingFlock.initialCount > 0 ? (totalMortality / viewingFlock.initialCount) * 100 : 0;
                      const getMortalityStatus = (rate: number) => {
                        if (rate > 15) return { status: 'HIGH RISK', color: 'text-red-600' };
                        if (rate > 5) return { status: 'MEDIUM', color: 'text-yellow-600' };
                        return { status: 'HEALTHY', color: 'text-green-600' };
                      };
                      const status = getMortalityStatus(mortalityRate);
                      return (
                        <div className="flex items-center space-x-2">
                          <span className={status.color}>{mortalityRate.toFixed(1)}%</span>
                          <Badge variant={mortalityRate > 15 ? "destructive" : mortalityRate > 5 ? "secondary" : "default"}>
                            {status.status}
                          </Badge>
                        </div>
                      );
                    })()}
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
              handleEditClick(viewingFlock!);
            }}>
              Edit Flock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title="Delete Flock"
        desc={
          confirmDialog.flock
            ? `Delete flock "${confirmDialog.flock.batchCode}"? This action cannot be undone.`
            : 'Are you sure you want to proceed?'
        }
        confirmText="Delete Flock"
        cancelBtnText="Cancel"
        destructive={true}
        handleConfirm={handleConfirmDelete}
        isLoading={deletingId === confirmDialog.flock?.id}
      />
    </div>
  );
}
