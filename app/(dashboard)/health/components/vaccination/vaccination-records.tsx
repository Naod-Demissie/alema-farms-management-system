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
import { VaccinationTableToolbar } from "./vaccination-table-toolbar";
import { getVaccinations, createVaccination, updateVaccination, deleteVaccination, markVaccinationAsCompleted } from "@/app/(dashboard)/health/server/health";
import { getFlocks } from "@/app/(dashboard)/flocks/server/flocks";
import { getStaff } from "@/app/(dashboard)/staff/server/staff";
import { format } from "date-fns";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useTranslations } from 'next-intl';


export function VaccinationRecords() {
  const t = useTranslations('health.vaccination');
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [flocks, setFlocks] = useState<any[]>([]);
  const [veterinarians, setVeterinarians] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVaccination, setEditingVaccination] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState<{
    open: boolean;
    vaccination: any | null;
  }>({
    open: false,
    vaccination: null,
  });
  const [newStatus, setNewStatus] = useState<string>("completed");
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
      
      // Prepare the vaccination data
      const vaccinationData = {
        ...data,
        // Only include administeredDate if it exists and is not scheduled
        ...(data.administeredDate && !data.isScheduled && {
          administeredDate: data.administeredDate.toISOString(),
        }),
        // Only include scheduledDate if it exists and is scheduled
        ...(data.scheduledDate && data.isScheduled && {
          scheduledDate: data.scheduledDate.toISOString(),
        }),
      };
      
      const result = await createVaccination(vaccinationData);
      
      if (result.success) {
        toast.success(t('createSuccess'), {
          description: t('createSuccessDesc', { vaccineName: data.vaccineName }),
        });
        await fetchVaccinations();
        setIsAddDialogOpen(false);
      } else {
        toast.error(t('createError'), {
          description: result.message || t('unexpectedError'),
        });
      }
    } catch (error) {
      console.error("Error creating vaccination:", error);
      toast.error(t('createError'), {
        description: error instanceof Error ? error.message : t('unexpectedError'),
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
      
      // Prepare the vaccination data
      const vaccinationData = {
        ...data,
        // Only include administeredDate if it exists and is not scheduled
        ...(data.administeredDate && !data.isScheduled && {
          administeredDate: data.administeredDate.toISOString(),
        }),
        // Only include scheduledDate if it exists and is scheduled
        ...(data.scheduledDate && data.isScheduled && {
          scheduledDate: data.scheduledDate.toISOString(),
        }),
      };
      
      const result = await updateVaccination(editingVaccination.id, vaccinationData);
      
      if (result.success) {
        toast.success(t('updateSuccess'), {
          description: t('updateSuccessDesc', { vaccineName: data.vaccineName }),
        });
        await fetchVaccinations();
        setIsAddDialogOpen(false);
        setEditingVaccination(null);
      } else {
        toast.error(t('updateError'), {
          description: result.message || t('unexpectedError'),
        });
      }
    } catch (error) {
      console.error("Error updating vaccination:", error);
      toast.error(t('updateError'), {
        description: error instanceof Error ? error.message : t('unexpectedError'),
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

  const handleUpdateStatus = (vaccination: any) => {
    setStatusUpdateDialog({
      open: true,
      vaccination: vaccination,
    });
    // Set initial status to opposite of current status
    const currentStatus = vaccination.isScheduled || vaccination.status === "scheduled" ? "scheduled" : "completed";
    setNewStatus(currentStatus === "scheduled" ? "completed" : "scheduled");
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
        toast.success(t('deleteSuccess'), {
          description: t('deleteSuccessDesc', { vaccineName: vaccination.vaccineName }),
        });
        await fetchVaccinations();
      } else {
        toast.error(t('deleteError'), {
          description: result.message || result.error || t('unexpectedError'),
        });
      }
    } catch (error) {
      console.error("Error deleting vaccination:", error);
      toast.error(t('deleteError'), {
        description: error instanceof Error ? error.message : t('unexpectedError'),
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusUpdateSubmit = async () => {
    if (!statusUpdateDialog.vaccination) return;
    
    setActionLoading(statusUpdateDialog.vaccination.id);
    try {
      // If changing to completed, use markVaccinationAsCompleted
      if (newStatus === "completed") {
        const today = new Date().toISOString();
        const result = await markVaccinationAsCompleted(statusUpdateDialog.vaccination.id, today);
        
        if (result.success) {
          toast.success(t('statusUpdateSuccess', 'Status updated successfully'), {
            description: `${statusUpdateDialog.vaccination.vaccineName} ${t('markedAsCompleted', 'has been marked as completed')}`,
          });
          await fetchVaccinations();
        } else {
          toast.error(t('statusUpdateError', 'Failed to update status'), {
            description: result.message || t('unexpectedError'),
          });
        }
      } else {
        // If changing to scheduled, update via updateVaccination
        const result = await updateVaccination(statusUpdateDialog.vaccination.id, {
          ...statusUpdateDialog.vaccination,
          isScheduled: true,
          status: "scheduled",
          administeredDate: statusUpdateDialog.vaccination.scheduledDate || new Date().toISOString(),
          scheduledDate: statusUpdateDialog.vaccination.scheduledDate || new Date().toISOString(),
        });
        
        if (result.success) {
          toast.success(t('statusUpdateSuccess', 'Status updated successfully'), {
            description: `${statusUpdateDialog.vaccination.vaccineName} ${t('markedAsScheduled', 'has been marked as scheduled')}`,
          });
          await fetchVaccinations();
        } else {
          toast.error(t('statusUpdateError', 'Failed to update status'), {
            description: result.message || t('unexpectedError'),
          });
        }
      }
      
      setStatusUpdateDialog({
        open: false,
        vaccination: null,
      });
    } catch (error) {
      console.error("Error updating vaccination status:", error);
      toast.error(t('statusUpdateError', 'Failed to update status'), {
        description: error instanceof Error ? error.message : t('unexpectedError'),
      });
    } finally {
      setActionLoading(null);
    }
  };



  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />{t('status.completed')}</Badge>;
      case "scheduled":
        return <Badge variant="outline" className="border-yellow-200 text-yellow-800"><Clock className="w-3 h-3 mr-1" />{t('status.scheduled')}</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="border-blue-200 text-blue-800"><Clock className="w-3 h-3 mr-1" />{t('status.inProgress')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h2>
        <p className="text-muted-foreground">
          {t('pageDescription')}
        </p>
      </div>

      {/* Vaccination Records Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>{t('recordsCount', { count: vaccinations.length })}</CardTitle>
              <CardDescription>
                {t('cardDescription')}
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addVaccination')}
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
                  administeredDate: editingVaccination.isScheduled ? undefined : (editingVaccination.administeredDate ? new Date(editingVaccination.administeredDate) : undefined),
                  scheduledDate: editingVaccination.isScheduled ? (editingVaccination.scheduledDate ? new Date(editingVaccination.scheduledDate) : new Date()) : undefined,
                  quantity: editingVaccination.quantity,
                  dosage: editingVaccination.dosage,
                  dosageUnit: editingVaccination.dosageUnit,
                  notes: editingVaccination.notes || "",
                  administrationMethod: editingVaccination.administrationMethod,
                  isScheduled: editingVaccination.isScheduled || false,
                  reminderEnabled: editingVaccination.reminderEnabled || false,
                  reminderDaysBefore: editingVaccination.reminderDaysBefore,
                  sendEmail: editingVaccination.sendEmail || false,
                  sendInAppAlert: editingVaccination.sendInAppAlert || false,
                  isRecurring: editingVaccination.isRecurring || false,
                  recurringInterval: editingVaccination.recurringInterval,
                  recurringEndDate: editingVaccination.recurringEndDate ? new Date(editingVaccination.recurringEndDate) : undefined,
                } : {
                  vaccineName: "",
                  flockId: "",
                  administeredDate: undefined,
                  scheduledDate: new Date(),
                  quantity: 0,
                  dosage: "",
                  dosageUnit: "",
                  notes: "",
                  administrationMethod: undefined,
                  isScheduled: true,
                  reminderEnabled: false,
                  reminderDaysBefore: undefined,
                  sendEmail: false,
                  sendInAppAlert: false,
                  isRecurring: false,
                  recurringInterval: undefined,
                  recurringEndDate: undefined,
                },
                title: editingVaccination ? t('editTitle') : t('addNewTitle'),
                description: editingVaccination ? t('editDescription') : t('addNewDescription'),
                submitText: editingVaccination ? t('updateButton') : t('addButton'),
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
                <p className="mt-2 text-sm text-muted-foreground">{t('loadingData')}</p>
              </div>
            </div>
          ) : (
            <VaccinationTable
              columns={vaccinationColumns(handleEdit, handleDeleteClick, handleUpdateStatus, getStatusBadge, t)}
              data={vaccinations}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onUpdateStatus={handleUpdateStatus}
              toolbar={(table) => <VaccinationTableToolbar table={table} flocks={flocks} />}
            />
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={t('deleteConfirmTitle')}
        desc={t('deleteConfirmDesc')}
        confirmText={t('deleteButton')}
        cancelBtnText={t('cancelButton')}
        destructive={true}
        handleConfirm={handleConfirmAction}
        isLoading={actionLoading === confirmDialog.vaccination?.id}
      />

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateDialog.open} onOpenChange={(open) => {
        if (!open) {
          setStatusUpdateDialog({ open: false, vaccination: null });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('updateStatusTitle', 'Update Vaccination Status')}</DialogTitle>
            <DialogDescription>
              {t('updateStatusDesc', 'Change the status of this vaccination record')}
            </DialogDescription>
          </DialogHeader>
          
          {statusUpdateDialog.vaccination && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Syringe className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{statusUpdateDialog.vaccination.vaccineName}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('flock')}: {statusUpdateDialog.vaccination.flock?.batchCode || statusUpdateDialog.vaccination.flockId}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newStatus">{t('newStatus', 'New Status')}</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="newStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">{t('scheduled', 'Scheduled')}</SelectItem>
                    <SelectItem value="completed">{t('completed', 'Completed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusUpdateDialog({ open: false, vaccination: null })}
            >
              {t('cancelButton', 'Cancel')}
            </Button>
            <Button
              onClick={handleStatusUpdateSubmit}
              disabled={actionLoading === statusUpdateDialog.vaccination?.id}
            >
              {actionLoading === statusUpdateDialog.vaccination?.id ? t('updating', 'Updating...') : t('updateButton', 'Update')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
