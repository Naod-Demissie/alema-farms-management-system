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
import { TreatmentForm, treatmentSchema } from "@/components/forms/dialog-forms";
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
import { getTreatments, createTreatment, updateTreatment, deleteTreatment } from "@/app/(dashboard)/health/server/health";
import { getFlocks } from "@/app/(dashboard)/flocks/server/flocks";
import { getStaff } from "@/app/(dashboard)/staff/server/staff";
import { format } from "date-fns";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useTranslations } from 'next-intl';


export function DiseaseTreatment() {
  const t = useTranslations('health.treatment');
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
      toast.error(t('loadDataError'));
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
        toast.success(t('createSuccess'));
        await loadData();
        setIsAddDialogOpen(false);
      } else {
        toast.error(result.error || t('createError'));
      }
    } catch (error) {
      console.error("Error creating treatment:", error);
      toast.error(t('createError'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (treatment: any) => {
    console.log("handleEdit called with treatment:", treatment);
    setEditingTreatment(treatment);
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
        toast.success(t('updateSuccess'));
        await loadData();
        setIsAddDialogOpen(false);
        setEditingTreatment(null);
      } else {
        toast.error(result.error || t('updateError'));
      }
    } catch (error) {
      console.error("Error updating treatment:", error);
      toast.error(t('updateError'));
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
        toast.success(t('deleteSuccess'));
        await loadData();
      } else {
        toast.error(result.error || t('deleteError'));
      }
    } catch (error) {
      console.error("Error deleting treatment:", error);
      toast.error(t('deleteError'));
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
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h2>
        <p className="text-muted-foreground">
          {t('pageDescription')}
        </p>
      </div>

      {/* Treatment Records Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>{t('title')}</CardTitle>
              <CardDescription>
                {t('recordsCount', { count: treatments.length })}
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addTreatment')}
                </Button>
              </DialogTrigger>
            </Dialog>
            
            <ReusableDialog
              open={isAddDialogOpen}
              onOpenChange={(open) => {
                console.log("Dialog onOpenChange called with:", open, "editingTreatment:", editingTreatment);
                setIsAddDialogOpen(open);
                if (!open) {
                  setEditingTreatment(null);
                }
              }}
              config={{
                schema: treatmentSchema,
                defaultValues: editingTreatment ? {
                  flockId: editingTreatment.flockId,
                  disease: editingTreatment.disease,
                  diseaseName: editingTreatment.diseaseName,
                  medication: editingTreatment.medication,
                  dosage: editingTreatment.dosage,
                  frequency: editingTreatment.frequency,
                  duration: editingTreatment.duration,
                  treatedBy: editingTreatment.treatedBy?.id || editingTreatment.treatedById,
                  startDate: new Date(editingTreatment.startDate),
                  endDate: editingTreatment.endDate ? new Date(editingTreatment.endDate) : undefined,
                  notes: editingTreatment.notes || "",
                  symptoms: editingTreatment.symptoms || "",
                } : {
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
                title: editingTreatment ? t('editTitle') : t('addNewTitle'),
                description: editingTreatment  
                  ? t('editDescription')
                  : t('addNewDescription'),
                submitText: editingTreatment ? t('updateButton') : t('addButton'),
                onSubmit: editingTreatment ? handleUpdate : handleSubmit,
                children: (form) => (
                  <TreatmentForm 
                    form={form} 
                    flocks={flocks}
                    veterinarians={veterinarians}
                  />
                ),
              }}
              loading={actionLoading === "create" || actionLoading === "update"}
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
        title={t('deleteConfirmTitle')}
        desc={t('deleteConfirmDesc')}
        confirmText={t('deleteButton')}
        cancelBtnText={t('cancelButton')}
        isLoading={actionLoading === "delete"}
        destructive
      />
    </div>
  );
}
