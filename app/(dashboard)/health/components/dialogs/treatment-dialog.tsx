"use client";

import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { ReusableDialog } from "@/components/ui/reusable-dialog";
import { TreatmentForm, treatmentSchema } from "@/components/forms/dialog-forms";
import { 
  createTreatment,
  updateTreatment
} from "@/app/(dashboard)/health/server/health";
import { getFlocks } from "@/app/(dashboard)/flocks/server/flocks";
import { toast } from "sonner";

// Flock interface
interface Flock {
  id: string;
  batchCode: string;
  currentCount: number;
}

// Staff interface
interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

// Treatment data interface
interface TreatmentData {
  id?: string;
  flockId: string;
  disease: "respiratory" | "digestive" | "parasitic" | "nutritional" | "other";
  diseaseName: string;
  diseasedBirdsCount: number;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  startDate: Date;
  endDate?: Date;
  notes?: string;
  symptoms?: string;
}

interface TreatmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flocks?: Flock[];
  flocksLoading?: boolean;
  initialData?: TreatmentData;
  onSuccess?: () => void;
  loading?: boolean;
  onLoadingChange?: (loading: boolean) => void;
}

export function TreatmentDialog({
  open,
  onOpenChange,
  flocks: propFlocks,
  flocksLoading: propFlocksLoading = false,
  initialData,
  onSuccess,
  loading = false,
  onLoadingChange
}: TreatmentDialogProps) {
  
  const t = useTranslations('health.treatment');
  const tCommon = useTranslations('common');
  
  const [flocks, setFlocks] = useState<Flock[]>(propFlocks || []);
  const [flocksLoading, setFlocksLoading] = useState(propFlocksLoading);

  // Fetch data when dialog opens if not provided
  useEffect(() => {
    if (open && !propFlocks) {
      const fetchFlocks = async () => {
        setFlocksLoading(true);
        try {
          const result = await getFlocks();
          if (result.success && result.data) {
            setFlocks(result.data);
          } else {
            console.error("Failed to fetch flocks:", result.message);
            toast.error("Failed to fetch flocks");
            setFlocks([]);
          }
        } catch (error) {
          console.error("Error fetching flocks:", error);
          toast.error("Error fetching flocks");
          setFlocks([]);
        } finally {
          setFlocksLoading(false);
        }
      };
      fetchFlocks();
    }
  }, [open, propFlocks]);

  // Get default values based on initial data
  const getDefaultValues = () => {
    if (initialData) {
      return {
        flockId: initialData.flockId || "",
        disease: (initialData.disease || "respiratory") as "respiratory" | "digestive" | "parasitic" | "nutritional" | "other",
        diseaseName: initialData.diseaseName || "",
        diseasedBirdsCount: initialData.diseasedBirdsCount || 0,
        medication: initialData.medication || "",
        dosage: initialData.dosage || "",
        frequency: initialData.frequency || "",
        duration: initialData.duration || "",
        startDate: initialData.startDate || new Date(),
        endDate: initialData.endDate || undefined,
        notes: initialData.notes || "",
        symptoms: initialData.symptoms || "",
      };
    }
    
    return {
      flockId: "",
      disease: "respiratory" as const,
      diseaseName: "",
      diseasedBirdsCount: 0,
      medication: "",
      dosage: "",
      frequency: "",
      duration: "",
      startDate: new Date(),
      endDate: undefined,
      notes: "",
      symptoms: "",
    };
  };

  // Handle form submission
  const handleSubmit = async (data: any) => {
    if (onLoadingChange) {
      onLoadingChange(true);
    }
    
    try {
      const treatmentData = {
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate?.toISOString(),
      };

      let result;
      if (initialData?.id) {
        result = await updateTreatment(initialData.id, treatmentData);
      } else {
        result = await createTreatment(treatmentData);
      }
      
      if (result.success) {
        toast.success(initialData?.id ? t('updateSuccess') : t('createSuccess'));
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(result.message || (initialData?.id ? t('updateError') : t('createError')));
      }
    } catch (error) {
      console.error("Error submitting treatment:", error);
      toast.error(initialData?.id ? t('updateError') : t('createError'));
    } finally {
      if (onLoadingChange) {
        onLoadingChange(false);
      }
    }
  };

  const dialogConfig = {
    title: initialData?.id ? t('editTitle') : t('addNewTitle'),
    description: initialData?.id ? t('editDescription') : t('addNewDescription'),
    submitText: initialData?.id ? t('updateButton') : t('addButton'),
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      config={{
        schema: treatmentSchema,
        defaultValues: getDefaultValues(),
        title: dialogConfig.title,
        description: dialogConfig.description,
        submitText: dialogConfig.submitText,
        cancelText: tCommon('cancel'),
        onSubmit: handleSubmit,
        maxWidth: "max-w-4xl",
        children: (form) => (
          <TreatmentForm 
            form={form} 
            flocks={flocks}
            flocksLoading={flocksLoading}
            t={t}
          />
        ),
      }}
      loading={loading}
    />
  );
}
