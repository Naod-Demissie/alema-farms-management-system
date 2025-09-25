"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertTriangle,
  Edit,
  CalendarIcon
} from "lucide-react";
import { 
  createFlock, 
  updateFlock, 
  deleteFlock, 
  updateFlockPopulation,
  generateBatchCode,
} from "@/server/flocks";
import { Flock, FlockFormData, BREED_OPTIONS, SOURCE_OPTIONS, POPULATION_UPDATE_REASONS } from "./flock-types";
import { format } from "date-fns";
import { FlockTable } from "./flock-table";
import { flockColumns } from "./flock-table-columns";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";


const populationUpdateSchema = z.object({
  newCount: z.number().min(0, "Count cannot be negative"),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional(),
});

interface FlockManagementMergedProps {
  flocks: Flock[];
  onFlockCreated: (flock: Flock) => void;
  onFlockUpdated: (flock: Flock) => void;
  onFlockDeleted: (flockId: string) => void;
  onRefresh: () => void;
}

export function FlockManagementMerged({
  flocks,
  onFlockCreated,
  onFlockUpdated,
  onFlockDeleted,
  onRefresh
}: FlockManagementMergedProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdatePopulationDialogOpen, setIsUpdatePopulationDialogOpen] = useState(false);
  const [editingFlock, setEditingFlock] = useState<Flock | null>(null);
  const [selectedFlock, setSelectedFlock] = useState<Flock | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    flock: null as Flock | null,
  });


  const populationForm = useForm<Omit<{ flockId: string; newCount: number; reason: string; notes?: string }, 'flockId'>>({
    resolver: zodResolver(populationUpdateSchema),
    defaultValues: {
      newCount: 0,
      reason: "",
      notes: "",
    },
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

  const handleUpdatePopulation = async (data: Omit<{ flockId: string; newCount: number; reason: string; notes?: string }, 'flockId'>) => {
    if (!selectedFlock) return;
    
    try {
      setLoading(true);
      const result = await updateFlockPopulation({
        flockId: selectedFlock.id,
        ...data
      });
      
      if (result.success) {
        onFlockUpdated(result.data);
        populationForm.reset();
        setIsUpdatePopulationDialogOpen(false);
        setSelectedFlock(null);
        toast.success("Population updated successfully!", {
          description: `Flock population updated to ${data.newCount} birds.`
        });
      } else {
        toast.error("Failed to update population", {
          description: result.message || "An unexpected error occurred."
        });
      }
    } catch (error) {
      console.error('Error updating population:', error);
      toast.error("Failed to update population", {
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

  const handleUpdatePopulationClick = (flock: Flock) => {
    setSelectedFlock(flock);
    populationForm.reset({
      newCount: flock.currentCount,
      reason: "",
      notes: "",
    });
    setIsUpdatePopulationDialogOpen(true);
  };

  const handleGenerateBatchCode = async (breed: string) => {
    try {
      const result = await generateBatchCode(breed as any);
      if (result.success) {
        form.setValue('batchCode', result.data.batchCode);
      }
    } catch (error) {
      console.error('Error generating batch code:', error);
    }
  };

  // Calculate statistics
  const totalBirds = flocks.reduce((sum, flock) => sum + flock.currentCount, 0);
  const averageMortalityRate = flocks.length > 0 
    ? flocks.reduce((sum, flock) => {
        const mortalityRate = ((flock.initialCount - flock.currentCount) / flock.initialCount) * 100;
        return sum + mortalityRate;
      }, 0) / flocks.length
    : 0;
  const highRiskFlocks = flocks.filter(flock => {
    const mortalityRate = ((flock.initialCount - flock.currentCount) / flock.initialCount) * 100;
    return mortalityRate > 15;
  }).length;
  const healthyFlocks = flocks.filter(flock => {
    const mortalityRate = ((flock.initialCount - flock.currentCount) / flock.initialCount) * 100;
    return mortalityRate <= 5;
  }).length;

  const tableMeta = {
    onEdit: handleEditClick,
    onUpdatePopulation: handleUpdatePopulationClick,
    onDelete: handleDeleteFlock,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Flock Management</h2>
          <p className="text-muted-foreground">
            Manage your poultry flocks and track their performance
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Birds</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalBirds.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all flocks
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Mortality</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageMortalityRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all flocks
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Flocks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {highRiskFlocks}
            </div>
            <p className="text-xs text-muted-foreground">
              Mortality rate &gt; 15%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy Flocks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthyFlocks}
            </div>
            <p className="text-xs text-muted-foreground">
              Mortality rate &le; 5%
            </p>
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
                  breed: "broiler",
                  source: "hatchery",
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
            onUpdatePopulation={handleUpdatePopulationClick}
            onDelete={handleDeleteFlock}
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
            breed: editingFlock.breed,
            source: editingFlock.source,
            arrivalDate: new Date(editingFlock.arrivalDate),
            initialCount: editingFlock.initialCount,
            currentCount: editingFlock.currentCount,
            ageInDays: editingFlock.ageInDays || 0,
            notes: "",
          } : {
            batchCode: "",
            breed: "broiler",
            source: "hatchery",
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

      {/* Update Population Dialog */}
      <Dialog open={isUpdatePopulationDialogOpen} onOpenChange={setIsUpdatePopulationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Flock Population</DialogTitle>
            <DialogDescription>
              Update the current population count for {selectedFlock?.batchCode}
            </DialogDescription>
          </DialogHeader>
          <Form {...populationForm}>
            <form onSubmit={populationForm.handleSubmit(handleUpdatePopulation)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Initial Count</label>
                  <div className="text-2xl font-bold text-muted-foreground">
                    {selectedFlock?.initialCount.toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Current Count</label>
                  <div className="text-2xl font-bold">
                    {selectedFlock?.currentCount.toLocaleString()}
                  </div>
                </div>
              </div>

              <FormField
                control={populationForm.control}
                name="newCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Count</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max={selectedFlock?.initialCount || 0}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={populationForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Change</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {POPULATION_UPDATE_REASONS.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={populationForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional details about the population change..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsUpdatePopulationDialogOpen(false);
                    setSelectedFlock(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Update Population
                </Button>
              </DialogFooter>
            </form>
          </Form>
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
