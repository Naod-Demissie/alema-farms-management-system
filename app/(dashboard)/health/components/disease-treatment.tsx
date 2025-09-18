"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Activity,
  CalendarDays,
  FileText,
  Pill,
  Stethoscope
} from "lucide-react";
import { TreatmentTable } from "./treatment-table";
import { treatmentColumns } from "./treatment-columns";
import { getTreatments, createTreatment, updateTreatment, deleteTreatment } from "@/server/health";
import { getFlocks } from "@/server/flocks";
import { getStaff } from "@/server/staff";
import { format } from "date-fns";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";

// Validation schema
const treatmentSchema = z.object({
  flockId: z.string().min(1, "Flock ID is required"),
  disease: z.enum(["respiratory", "digestive", "parasitic", "nutritional", "other"], {
    message: "Disease type is required",
  }),
  diseaseName: z.string().min(1, "Disease name is required"),
  medication: z.string().min(1, "Medication is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  duration: z.string().min(1, "Duration is required"),
  treatedBy: z.string().min(1, "Treated by is required"),
  startDate: z.date({
    message: "Start date is required",
  }),
  endDate: z.date().optional(),
  notes: z.string().optional(),
  symptoms: z.string().optional(),
});

export function DiseaseTreatment() {
  const [treatments, setTreatments] = useState<any[]>([]);
  const [flocks, setFlocks] = useState<any[]>([]);
  const [veterinarians, setVeterinarians] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | null;
    treatment: any | null;
  }>({
    open: false,
    type: null,
    treatment: null,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form setup
  const form = useForm<z.infer<typeof treatmentSchema>>({
    resolver: zodResolver(treatmentSchema),
    defaultValues: {
      flockId: "",
      disease: "respiratory",
      diseaseName: "",
      medication: "",
      dosage: "",
      frequency: "",
      duration: "",
      treatedBy: "",
      startDate: new Date(),
      endDate: undefined,
      notes: "",
      symptoms: "",
    },
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [treatmentsRes, flocksRes, staffRes] = await Promise.all([
        getTreatments(1, 100),
        getFlocks(),
        getStaff(),
      ]);

      if (treatmentsRes.success) {
        setTreatments(treatmentsRes.data?.treatments || []);
      }
      if (flocksRes.success) {
        setFlocks(flocksRes.data || []);
      }
      if (staffRes.success) {
        setVeterinarians((staffRes.data || []).filter((staff: any) => 
          staff.role === 'VETERINARIAN' || staff.role === 'ADMIN'
        ));
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: z.infer<typeof treatmentSchema>) => {
    setActionLoading("create");
    try {
      const treatmentData = {
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate?.toISOString(),
      };

      const result = await createTreatment(treatmentData);
      
      if (result.success) {
        toast.success("Treatment created successfully");
        await loadData();
        setIsAddDialogOpen(false);
        form.reset();
      } else {
        toast.error(result.error || "Failed to create treatment");
      }
    } catch (error) {
      console.error("Error creating treatment:", error);
      toast.error("Failed to create treatment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (treatment: any) => {
    console.log("handleEdit called with treatment:", treatment);
    setEditingTreatment(treatment);
    
    const formData = {
      flockId: treatment.flockId,
      disease: treatment.disease,
      diseaseName: treatment.diseaseName,
      medication: treatment.medication,
      dosage: treatment.dosage,
      frequency: treatment.frequency,
      duration: treatment.duration,
      treatedBy: treatment.treatedBy?.id || treatment.treatedById,
      startDate: new Date(treatment.startDate),
      endDate: treatment.endDate ? new Date(treatment.endDate) : undefined,
      notes: treatment.notes || "",
      symptoms: treatment.symptoms || "",
    };
    
    console.log("Form data to reset:", formData);
    form.reset(formData);
    console.log("Setting dialog open to true, editingTreatment:", treatment);
    setIsAddDialogOpen(true);
  };

  const handleUpdate = async (data: z.infer<typeof treatmentSchema>) => {
    if (!editingTreatment) return;
    
    setActionLoading("update");
    try {
      const treatmentData = {
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate?.toISOString(),
      };

      const result = await updateTreatment(editingTreatment.id, treatmentData);
      
      if (result.success) {
        toast.success("Treatment updated successfully");
        await loadData();
        setIsAddDialogOpen(false);
        setEditingTreatment(null);
        form.reset();
      } else {
        toast.error(result.error || "Failed to update treatment");
      }
    } catch (error) {
      console.error("Error updating treatment:", error);
      toast.error("Failed to update treatment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = (treatment: any) => {
    setConfirmDialog({
      open: true,
      type: 'delete',
      treatment,
    });
  };

  const confirmDelete = async () => {
    if (!confirmDialog.treatment) return;
    
    setActionLoading("delete");
    try {
      const result = await deleteTreatment(confirmDialog.treatment.id);
      
      if (result.success) {
        toast.success("Treatment deleted successfully");
        await loadData();
      } else {
        toast.error(result.error || "Failed to delete treatment");
      }
    } catch (error) {
      console.error("Error deleting treatment:", error);
      toast.error("Failed to delete treatment");
    } finally {
      setActionLoading(null);
      setConfirmDialog({
        open: false,
        type: null,
        treatment: null,
      });
    }
  };

  const getDiseaseBadge = (disease: string) => {
    const colors = {
      respiratory: "bg-blue-100 text-blue-800",
      digestive: "bg-green-100 text-green-800",
      parasitic: "bg-purple-100 text-purple-800",
      nutritional: "bg-yellow-100 text-yellow-800",
      other: "bg-gray-100 text-gray-800",
    };
    
    const labels = {
      respiratory: "Respiratory",
      digestive: "Digestive",
      parasitic: "Parasitic",
      nutritional: "Nutritional",
      other: "Other",
    };

    return (
      <Badge variant="outline" className={colors[disease as keyof typeof colors]}>
        {labels[disease as keyof typeof labels]}
      </Badge>
    );
  };

  const getResponseBadge = (response: string) => {
    switch (response) {
      case "improved":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Improved</Badge>;
      case "no_change":
        return <Badge variant="outline" className="border-yellow-200 text-yellow-800"><Clock className="w-3 h-3 mr-1" />No Change</Badge>;
      case "worsened":
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Worsened</Badge>;
      default:
        return <Badge variant="secondary">{response}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Disease Treatment</h2>
          <p className="text-muted-foreground">
            Track disease classification, medication, and treatment response monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            console.log("Dialog onOpenChange called with:", open, "editingTreatment:", editingTreatment);
            setIsAddDialogOpen(open);
            if (!open) {
              setEditingTreatment(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Treatment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTreatment ? "Edit Treatment" : "Add New Treatment"}
                </DialogTitle>
                <DialogDescription>
                  {editingTreatment 
                    ? "Update the treatment information below."
                    : "Fill in the details below to add a new treatment record."
                  }
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(editingTreatment ? handleUpdate : handleSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="flockId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Flock ID</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select flock" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {flocks.map((flock) => (
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
                    <FormField
                      control={form.control}
                      name="disease"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Disease Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select disease type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="respiratory">Respiratory</SelectItem>
                              <SelectItem value="digestive">Digestive</SelectItem>
                              <SelectItem value="parasitic">Parasitic</SelectItem>
                              <SelectItem value="nutritional">Nutritional</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="diseaseName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disease Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Infectious Bronchitis" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="medication"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medication</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Amoxicillin" {...field} />
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
                          <FormLabel>Dosage</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 10mg/kg body weight" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequency</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Twice daily" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 5 days" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="treatedBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Treated By</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select veterinarian" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {veterinarians.map((vet) => (
                                <SelectItem key={vet.id} value={vet.id}>
                                  {vet.name}
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
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
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
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
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
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="symptoms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Symptoms</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the symptoms observed..."
                            className="resize-none"
                            rows={3}
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
                            placeholder="Additional notes about the treatment..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setIsAddDialogOpen(false);
                      setEditingTreatment(null);
                      form.reset();
                    }}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={actionLoading === "create" || actionLoading === "update"}
                    >
                      {actionLoading === "create" || actionLoading === "update" ? (
                        "Saving..."
                      ) : editingTreatment ? (
                        "Update Treatment"
                      ) : (
                        "Add Treatment"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Treatment Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Treatment Records</CardTitle>
          <CardDescription>
            {treatments.length} treatment records found
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
            <TreatmentTable
              columns={treatmentColumns(handleEdit, handleDelete, getDiseaseBadge, getResponseBadge)}
              data={treatments}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        handleConfirm={confirmDelete}
        title="Delete Treatment"
        desc="Are you sure you want to delete this treatment record? This action cannot be undone."
        confirmText="Delete"
        cancelBtnText="Cancel"
        isLoading={actionLoading === "delete"}
        destructive
      />
    </div>
  );
}
