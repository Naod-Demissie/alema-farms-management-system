"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  Syringe,
  CalendarDays,
  FileText
} from "lucide-react";
import { VaccinationTable } from "./vaccination-table";
import { vaccinationColumns } from "./vaccination-columns";
import { getVaccinations, createVaccination, updateVaccination, deleteVaccination } from "@/server/health";
import { getFlocks } from "@/server/flocks";
import { getStaff } from "@/server/staff";
import { format } from "date-fns";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";

// Validation schema
const vaccinationSchema = z.object({
  vaccineName: z.string().min(1, "Vaccine name is required"),
  flockId: z.string().min(1, "Flock ID is required"),
  administeredDate: z.date({
    message: "Administered date is required",
  }),
  administeredBy: z.string().min(1, "Administered by is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  dosage: z.string().min(1, "Dosage is required"),
  notes: z.string().optional(),
});

export function VaccinationRecords() {
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [flocks, setFlocks] = useState<any[]>([]);
  const [veterinarians, setVeterinarians] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVaccination, setEditingVaccination] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | null;
    vaccination: any | null;
  }>({
    open: false,
    type: null,
    vaccination: null,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form setup
  const form = useForm<z.infer<typeof vaccinationSchema>>({
    resolver: zodResolver(vaccinationSchema),
    defaultValues: {
      vaccineName: "",
      flockId: "",
      administeredDate: new Date(),
      administeredBy: "",
      quantity: 0,
      dosage: "",
      notes: "",
    },
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchVaccinations();
    fetchFlocks();
    fetchVeterinarians();
  }, []);

  const fetchVaccinations = async () => {
    try {
      setLoading(true);
      console.log("Fetching vaccinations...");
      console.log("getVaccinations function:", typeof getVaccinations);
      const result = await getVaccinations(1, 100);
      console.log("Vaccinations result:", result);
      console.log("Result type:", typeof result);
      console.log("Result keys:", result ? Object.keys(result) : "result is null/undefined");
      
      if (result && result.success) {
        setVaccinations(result.data.vaccinations || []);
        console.log("Vaccinations set:", result.data.vaccinations);
      } else {
        console.error("Failed to fetch vaccinations:", result?.message || "Unknown error", result);
        setVaccinations([]);
      }
    } catch (error) {
      console.error("Error fetching vaccinations:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
      setVaccinations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlocks = async () => {
    try {
      console.log("Fetching flocks...");
      const result = await getFlocks({}, { page: 1, limit: 100 });
      console.log("Flocks result:", result);
      if (result && result.success && result.data) {
        setFlocks(result.data);
        console.log("Flocks set:", result.data);
      } else {
        console.error("Failed to fetch flocks:", result?.message || "Unknown error", result);
        setFlocks([]);
      }
    } catch (error) {
      console.error("Error fetching flocks:", error);
      setFlocks([]);
    }
  };

  const fetchVeterinarians = async () => {
    try {
      console.log("Fetching veterinarians...");
      const result = await getStaff();
      console.log("Staff result:", result);
      if (result && result.success && result.data) {
        // Filter staff to only include veterinarians
        const vets = result.data.filter((staff: any) => staff.role === "VETERINARIAN" && staff.isActive);
        setVeterinarians(vets);
        console.log("Veterinarians set:", vets);
      } else {
        console.error("Failed to fetch staff:", result?.message || "Unknown error", result);
        setVeterinarians([]);
      }
    } catch (error) {
      console.error("Error fetching veterinarians:", error);
      setVeterinarians([]);
    }
  };

  const handleSubmit = async (data: z.infer<typeof vaccinationSchema>) => {
    try {
      setLoading(true);
      const result = await createVaccination({
        ...data,
        administeredDate: data.administeredDate.toISOString(),
      });
      
      if (result.success) {
        toast.success("Vaccination record created successfully!", {
          description: `${data.vaccineName} vaccination has been recorded for the flock`,
        });
        await fetchVaccinations();
        setIsAddDialogOpen(false);
        form.reset();
      } else {
        toast.error("Failed to create vaccination record", {
          description: result.message || "An unexpected error occurred",
        });
      }
    } catch (error) {
      console.error("Error creating vaccination:", error);
      toast.error("Failed to create vaccination record", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vaccination: any) => {
    setEditingVaccination(vaccination);
    form.reset({
      vaccineName: vaccination.vaccineName,
      flockId: vaccination.flockId,
      administeredDate: new Date(vaccination.administeredDate),
      administeredBy: vaccination.administeredBy,
      quantity: vaccination.quantity,
      dosage: vaccination.dosage,
      notes: vaccination.notes || "",
    });
    setIsAddDialogOpen(true);
  };

  const handleUpdate = async (data: z.infer<typeof vaccinationSchema>) => {
    if (!editingVaccination) return;
    
    try {
      setLoading(true);
      const result = await updateVaccination(editingVaccination.id, {
        ...data,
        administeredDate: data.administeredDate.toISOString(),
      });
      
      if (result.success) {
        toast.success("Vaccination record updated successfully!", {
          description: `${data.vaccineName} vaccination record has been updated`,
        });
        await fetchVaccinations();
        setIsAddDialogOpen(false);
        setEditingVaccination(null);
        form.reset();
      } else {
        toast.error("Failed to update vaccination record", {
          description: result.message || "An unexpected error occurred",
        });
      }
    } catch (error) {
      console.error("Error updating vaccination:", error);
      toast.error("Failed to update vaccination record", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (vaccination: any) => {
    setConfirmDialog({
      open: true,
      type: 'delete',
      vaccination: vaccination,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.type) return;

    if (confirmDialog.type === 'delete' && confirmDialog.vaccination) {
      await executeDeleteVaccination(confirmDialog.vaccination);
    }

    setConfirmDialog({
      open: false,
      type: null,
      vaccination: null,
    });
  };

  const executeDeleteVaccination = async (vaccination: any) => {
    setActionLoading(vaccination.id);
    try {
      const result = await deleteVaccination(vaccination.id);
      
      if (result.success) {
        toast.success("Vaccination record deleted successfully!", {
          description: `${vaccination.vaccineName} vaccination record has been removed`,
        });
        await fetchVaccinations();
      } else {
        toast.error("Failed to delete vaccination record", {
          description: result.message || result.error || "An unexpected error occurred",
        });
      }
    } catch (error) {
      console.error("Error deleting vaccination:", error);
      toast.error("Failed to delete vaccination record", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setActionLoading(null);
    }
  };



  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "scheduled":
        return <Badge variant="outline" className="border-yellow-200 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Scheduled</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="border-blue-200 text-blue-800"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vaccination Records</h2>
          <p className="text-muted-foreground">
            Track vaccine administration with lot numbers and detailed records
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Vaccination
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingVaccination ? "Edit Vaccination Record" : "Add New Vaccination Record"}
                </DialogTitle>
                <DialogDescription>
                  Record vaccine administration details including dosage and administration information.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(editingVaccination ? handleUpdate : handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="vaccineName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Vaccine Name <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Newcastle Disease Vaccine" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="flockId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Flock ID <span className="text-red-500">*</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select flock" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {flocks.map((flock: any) => (
                                <SelectItem key={flock.id} value={flock.id}>
                                  {flock.batchCode}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="administeredDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Administered Date <span className="text-red-500">*</span>
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
                      name="administeredBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Administered By <span className="text-red-500">*</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                      <SelectTrigger>
                                <SelectValue placeholder="Select veterinarian" />
                      </SelectTrigger>
                            </FormControl>
                      <SelectContent>
                              {veterinarians.map((vet: any) => (
                                <SelectItem key={vet.id} value={vet.name}>
                                  {vet.name}
                                </SelectItem>
                              ))}
                      </SelectContent>
                    </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Quantity <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                    <Input
                      type="number"
                      placeholder="500"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dosage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Dosage <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 0.5ml per bird" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                  <Textarea
                    placeholder="Additional notes about the vaccination..."
                    rows={3}
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
                      {loading ? "Saving..." : editingVaccination ? "Update Record" : "Add Record"}
                  </Button>
                </DialogFooter>
              </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>


      {/* Vaccination Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vaccination Records ({vaccinations.length})</CardTitle>
          <CardDescription>
            Manage and track vaccination records for your poultry flocks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading data...</p>
              </div>
            </div>
          ) : (
            <VaccinationTable
            columns={vaccinationColumns(handleEdit, handleDeleteClick, getStatusBadge)}
              data={vaccinations}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
          />
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={
          confirmDialog.type === 'delete'
            ? 'Delete Vaccination Record'
            : 'Confirm Action'
        }
        desc={
          confirmDialog.type === 'delete'
            ? `Are you sure you want to delete the vaccination record for "${confirmDialog.vaccination?.vaccineName}"? This action cannot be undone and the vaccination record will be permanently removed.`
            : 'Are you sure you want to proceed?'
        }
        confirmText={
          confirmDialog.type === 'delete'
            ? 'Delete Vaccination Record'
            : 'Continue'
        }
        cancelBtnText="Cancel"
        destructive={confirmDialog.type === 'delete'}
        handleConfirm={handleConfirmAction}
        isLoading={actionLoading === confirmDialog.vaccination?.id}
      />
    </div>
  );
}
