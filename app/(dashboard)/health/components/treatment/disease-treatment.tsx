"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
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
import { TreatmentDialog } from "@/app/(dashboard)/health/components/dialogs/treatment-dialog";
import { ReusableDialog } from "@/components/ui/reusable-dialog";
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
import { getTreatments, createTreatment, updateTreatment, deleteTreatment, updateTreatmentStatus } from "@/app/(dashboard)/health/server/health";
import { getFlocks } from "@/app/(dashboard)/flocks/server/flocks";
import { format } from "date-fns";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { treatmentStatusUpdateSchema, TreatmentStatusUpdateForm } from "@/components/forms/dialog-forms";


export function DiseaseTreatment() {
  const t = useTranslations('health.treatment');
  const [treatments, setTreatments] = useState<any[]>([]);
  const [flocks, setFlocks] = useState<Array<{ id: string; batchCode: string; currentCount: number }>>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | null;
    treatment: any | null;
  }>({
    open: false,
    type: null,
    treatment: null,
  });
  const [statusUpdateDialog, setStatusUpdateDialog] = useState<{
    open: boolean;
    treatment: any | null;
  }>({
    open: false,
    treatment: null,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadData();
    fetchFlocks();
  }, []);

  const fetchFlocks = async () => {
    try {
      const result = await getFlocks({}, { page: 1, limit: 100 });
      if (result.success && result.data) {
        setFlocks(result.data.map(flock => ({
          id: flock.id,
          batchCode: flock.batchCode,
          currentCount: flock.currentCount
        })));
      } else {
        console.error("Failed to fetch flocks:", result.message);
        setFlocks([]);
      }
    } catch (error) {
      console.error("Error fetching flocks:", error);
      setFlocks([]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const treatmentsRes = await getTreatments(1, 100);

      if (treatmentsRes.success) {
        setTreatments(treatmentsRes.data?.treatments || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(t('loadDataError'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (treatment: any) => {
    console.log("handleEdit called with treatment:", treatment);
    setEditingTreatment(treatment);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (treatment: any) => {
    setConfirmDialog({
      open: true,
      type: 'delete',
      treatment,
    });
  };

  const handleUpdateStatus = (treatment: any) => {
    console.log("handleUpdateStatus called with treatment:", treatment);
    setStatusUpdateDialog({
      open: true,
      treatment,
    });
  };

  const handleStatusUpdate = async (data: z.infer<typeof treatmentStatusUpdateSchema>) => {
    if (!statusUpdateDialog.treatment) return;
    
    setActionLoading("statusUpdate");
    try {
      const result = await updateTreatmentStatus(statusUpdateDialog.treatment.id, data);
      
      if (result.success) {
        toast.success(t('statusUpdateSuccess'));
        await loadData();
        setStatusUpdateDialog({ open: false, treatment: null });
      } else {
        toast.error(result.error || t('statusUpdateError'));
      }
    } catch (error) {
      console.error("Error updating treatment status:", error);
      toast.error(t('statusUpdateError'));
    } finally {
      setActionLoading(null);
    }
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
            
            <TreatmentDialog
              open={isAddDialogOpen}
              onOpenChange={(open) => {
                console.log("Dialog onOpenChange called with:", open, "editingTreatment:", editingTreatment);
                setIsAddDialogOpen(open);
                if (!open) {
                  setEditingTreatment(null);
                }
              }}
              initialData={editingTreatment ? {
                id: editingTreatment.id,
                flockId: editingTreatment.flockId,
                disease: editingTreatment.disease || "respiratory",
                diseaseName: editingTreatment.diseaseName,
                diseasedBirdsCount: editingTreatment.diseasedBirdsCount || 0,
                medication: editingTreatment.medication,
                dosage: editingTreatment.dosage,
                frequency: editingTreatment.frequency,
                duration: editingTreatment.duration,
                startDate: new Date(editingTreatment.startDate),
                endDate: editingTreatment.endDate ? new Date(editingTreatment.endDate) : undefined,
                notes: editingTreatment.notes || "",
                symptoms: editingTreatment.symptoms || "",
              } : undefined}
              onSuccess={() => {
                setIsAddDialogOpen(false);
                setEditingTreatment(null);
                loadData();
              }}
              loading={dialogLoading}
              onLoadingChange={setDialogLoading}
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
              columns={treatmentColumns(handleEdit, handleDelete, handleUpdateStatus, getDiseaseBadge, t)}
              data={treatments}
              flocks={flocks}
            />
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <ReusableDialog
        open={statusUpdateDialog.open}
        onOpenChange={(open) => setStatusUpdateDialog({ ...statusUpdateDialog, open })}
        config={{
          schema: treatmentStatusUpdateSchema,
          maxWidth: "max-w-2xl",
          defaultValues: {
            deceasedCount: statusUpdateDialog.treatment?.deceasedCount || 0,
            recoveredCount: statusUpdateDialog.treatment?.recoveredCount || 0,
            stillSickCount: statusUpdateDialog.treatment?.stillSickCount || 0,
            statusUpdateNotes: statusUpdateDialog.treatment?.statusUpdateNotes || "",
          },
          title: t('statusUpdate.title'),
          description: t('statusUpdate.description'),
          submitText: t('statusUpdate.submitButton'),
          onSubmit: handleStatusUpdate,
          children: (form) => (
            <TreatmentStatusUpdateForm 
              form={form} 
              treatment={statusUpdateDialog.treatment}
              t={t}
            />
          ),
        }}
        loading={actionLoading === "statusUpdate"}
      />

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
