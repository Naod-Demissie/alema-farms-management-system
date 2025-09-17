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

const flockSchema = z.object({
  batchCode: z.string().min(1, "Batch code is required"),
  breed: z.enum(['broiler', 'layer', 'dual_purpose']),
  source: z.enum(['hatchery', 'farm', 'imported']),
  arrivalDate: z.date(),
  initialCount: z.number().min(1, "Initial count must be at least 1"),
  currentCount: z.number().min(0, "Current count cannot be negative"),
  ageInDays: z.number().min(0, "Age at arrival is required"),
  notes: z.string().optional(),
}).refine((data) => data.currentCount <= data.initialCount, {
  message: "Current count cannot exceed initial count",
  path: ["currentCount"],
});

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

  const form = useForm<FlockFormData>({
    resolver: zodResolver(flockSchema),
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
  });

  const populationForm = useForm<Omit<{ flockId: string; newCount: number; reason: string; notes?: string }, 'flockId'>>({
    resolver: zodResolver(populationUpdateSchema),
    defaultValues: {
      newCount: 0,
      reason: "",
      notes: "",
    },
  });

  const handleCreateFlock = async (data: FlockFormData) => {
    try {
      setLoading(true);
      const result = await createFlock(data);
      
      if (result.success) {
        onFlockCreated(result.data);
        form.reset();
        setIsCreateDialogOpen(false);
      } else {
        console.error('Error creating flock:', result.message);
      }
    } catch (error) {
      console.error('Error creating flock:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditFlock = async (data: FlockFormData) => {
    if (!editingFlock) return;
    
    try {
      setLoading(true);
      const result = await updateFlock(editingFlock.id, data);
      
      if (result.success) {
        onFlockUpdated(result.data);
        form.reset();
        setIsEditDialogOpen(false);
        setEditingFlock(null);
      } else {
        console.error('Error updating flock:', result.message);
      }
    } catch (error) {
      console.error('Error updating flock:', error);
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
      } else {
        console.error('Error updating population:', result.message);
      }
    } catch (error) {
      console.error('Error updating population:', error);
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
      } else {
        console.error('Error deleting flock:', result.message);
      }
    } catch (error) {
      console.error('Error deleting flock:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (flock: Flock) => {
    setEditingFlock(flock);
    form.reset({
      batchCode: flock.batchCode,
      breed: flock.breed,
      source: flock.source,
      arrivalDate: new Date(flock.arrivalDate),
      initialCount: flock.initialCount,
      currentCount: flock.currentCount,
      ageInDays: flock.ageInDays || 0,
      notes: "",
    });
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
        <div className="flex space-x-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Flock
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Flock</DialogTitle>
                <DialogDescription>
                  Create a new flock with unique batch code and tracking information
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateFlock)} className="space-y-6">
                  {/* Row 1: Batch Code Generation */}
                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="batchCode"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="flex items-center gap-1">
                            Batch Code <span className="text-red-500">*</span>
                          </FormLabel>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <FormControl>
                              <Input placeholder="e.g., BR2401001" {...field} className="h-10" />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleGenerateBatchCode(form.getValues('breed'))}
                              className="whitespace-nowrap h-10 px-4"
                            >
                              Generate
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Row 2: Breed Type and Source */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <FormField
                      control={form.control}
                      name="breed"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="flex items-center gap-1">
                            Breed Type <span className="text-red-500">*</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-16 min-h-[4rem] w-full overflow-hidden">
                                <SelectValue placeholder="Select breed" className="truncate" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {BREED_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="py-3">
                                  <div className="text-left">
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-sm text-muted-foreground">{option.description}</div>
                                  </div>
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
                      name="source"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="flex items-center gap-1">
                            Source <span className="text-red-500">*</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-16 min-h-[4rem] w-full overflow-hidden">
                                <SelectValue placeholder="Select source" className="truncate" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SOURCE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="py-3">
                                  <div className="text-left">
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-sm text-muted-foreground">{option.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Row 3: Arrival Date and Age in Days */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <FormField
                      control={form.control}
                      name="arrivalDate"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="flex items-center gap-1">
                            Arrival Date <span className="text-red-500">*</span>
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal h-10",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                captionLayout="dropdown"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ageInDays"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="flex items-center gap-1">
                            Age at Arrival (Days) <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="e.g., 1, 7, 14"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Row 4: Initial Count and Current Count */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <FormField
                      control={form.control}
                      name="initialCount"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="flex items-center gap-1">
                            Initial Count <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="e.g., 1000"
                              value={field.value || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value === "" ? 0 : parseInt(value) || 0);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="currentCount"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="flex items-center gap-1">
                            Current Count <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="e.g., 950"
                              value={field.value || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value === "" ? 0 : parseInt(value) || 0);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Row 5: Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional notes about the flock..."
                            className="min-h-[80px]"
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
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create Flock
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
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
          <CardTitle>Flock Management ({flocks.length})</CardTitle>
          <CardDescription>
            Manage and track your poultry flocks with population monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
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
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Flock</DialogTitle>
            <DialogDescription>
              Update flock information and tracking details
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditFlock)} className="space-y-6">
              {/* Row 1: Batch Code Generation */}
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="batchCode"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="flex items-center gap-1">
                        Batch Code <span className="text-red-500">*</span>
                      </FormLabel>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <FormControl>
                          <Input placeholder="e.g., BR2401001" {...field} className="h-10" />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleGenerateBatchCode(form.getValues('breed'))}
                          className="whitespace-nowrap h-10 px-4"
                        >
                          Generate
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 2: Breed Type and Source */}
              <div className="flex flex-col sm:flex-row gap-4">
                <FormField
                  control={form.control}
                  name="breed"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="flex items-center gap-1">
                        Breed Type <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-16 min-h-[4rem] w-full overflow-hidden">
                            <SelectValue placeholder="Select breed" className="truncate" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BREED_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="py-3">
                              <div className="text-left">
                                <div className="font-medium">{option.label}</div>
                                <div className="text-sm text-muted-foreground">{option.description}</div>
                              </div>
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
                  name="source"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="flex items-center gap-1">
                        Source <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-16 min-h-[4rem] w-full overflow-hidden">
                            <SelectValue placeholder="Select source" className="truncate" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SOURCE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="py-3">
                              <div className="text-left">
                                <div className="font-medium">{option.label}</div>
                                <div className="text-sm text-muted-foreground">{option.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 3: Arrival Date and Age in Days */}
              <div className="flex flex-col sm:flex-row gap-4">
                <FormField
                  control={form.control}
                  name="arrivalDate"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="flex items-center gap-1">
                        Arrival Date <span className="text-red-500">*</span>
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal h-10",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            captionLayout="dropdown"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ageInDays"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="flex items-center gap-1">
                        Age at Arrival (Days) <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="e.g., 1, 7, 14"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 4: Initial Count and Current Count */}
              <div className="flex flex-col sm:flex-row gap-4">
                <FormField
                  control={form.control}
                  name="initialCount"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="flex items-center gap-1">
                        Initial Count <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="e.g., 1000"
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === "" ? 0 : parseInt(value) || 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currentCount"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="flex items-center gap-1">
                        Current Count <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="e.g., 950"
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === "" ? 0 : parseInt(value) || 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 5: Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes about the flock..."
                        className="min-h-[80px]"
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
                    setIsEditDialogOpen(false);
                    setEditingFlock(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Update Flock
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

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
