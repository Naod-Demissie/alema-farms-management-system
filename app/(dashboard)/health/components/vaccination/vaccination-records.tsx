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
import { ReusableDialog } from "@/components/ui/reusable-dialog";
import { VaccinationForm, vaccinationSchema } from "@/components/forms/dialog-forms";
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
import { getVaccinations, createVaccination, updateVaccination, deleteVaccination } from "@/app/(dashboard)/health/server/health";
import { getFlocks } from "@/app/(dashboard)/flocks/server/flocks";
import { getStaff } from "@/app/(dashboard)/staff/server/staff";
import { format } from "date-fns";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";


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
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Vaccination Records</h2>
        <p className="text-muted-foreground">
          Track vaccine administration with lot numbers and detailed records
        </p>
      </div>

      {/* Vaccination Records Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Vaccination Records ({vaccinations.length})</CardTitle>
              <CardDescription>
                Manage and track vaccination records for your poultry flocks
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vaccination
                </Button>
              </DialogTrigger>
            </Dialog>
            
            <ReusableDialog
              open={isAddDialogOpen}
              onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (!open) {
                  setEditingVaccination(null);
                }
              }}
              config={{
                schema: vaccinationSchema,
                defaultValues: editingVaccination ? {
                  vaccineName: editingVaccination.vaccineName,
                  flockId: editingVaccination.flockId,
                  administeredDate: new Date(editingVaccination.administeredDate),
                  administeredBy: editingVaccination.administeredBy,
                  quantity: editingVaccination.quantity,
                  dosage: editingVaccination.dosage,
                  notes: editingVaccination.notes || "",
                } : {
                  vaccineName: "",
                  flockId: "",
                  administeredDate: new Date(),
                  administeredBy: "",
                  quantity: 0,
                  dosage: "",
                  notes: "",
                },
                title: editingVaccination ? "Edit Vaccination Record" : "Add New Vaccination Record",
                description: "Record vaccine administration details including dosage and administration information.",
                submitText: editingVaccination ? "Update Record" : "Add Record",
                onSubmit: editingVaccination ? handleUpdate : handleSubmit,
                children: (form) => (
                  <VaccinationForm 
                    form={form} 
                    flocks={flocks}
                    veterinarians={veterinarians}
                  />
                ),
              }}
              loading={loading}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
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
            ? 'Delete Vaccination'
            : 'Confirm Action'
        }
        desc={
          confirmDialog.type === 'delete'
            ? 'Are you sure you want to delete this vaccination record? This action cannot be undone.'
            : 'Are you sure you want to proceed?'
        }
        confirmText={
          confirmDialog.type === 'delete'
            ? 'Delete'
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
