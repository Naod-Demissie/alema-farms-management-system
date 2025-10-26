"use client";

import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { ReusableDialog } from "@/components/ui/reusable-dialog";
import { VaccinationForm, vaccinationSchema } from "@/components/forms/dialog-forms";
import { 
  createVaccination,
  updateVaccination
} from "@/app/(dashboard)/health/server/health";
import { getFlocks } from "@/app/(dashboard)/flocks/server/flocks";
import { getStaff } from "@/app/(dashboard)/staff/server/staff";
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

// Vaccination data interface
interface VaccinationData {
  id?: string;
  vaccineName: string;
  flockId: string;
  administeredDate?: Date;
  scheduledDate?: Date;
  quantity: number;
  dosage: string;
  dosageUnit: string;
  notes?: string;
  administrationMethod?: "INJECTION" | "DRINKING_WATER" | "SPRAY" | "OTHER";
  isScheduled: boolean;
  reminderEnabled: boolean;
  reminderDaysBefore?: number;
  sendEmail: boolean;
  sendInAppAlert: boolean;
  isRecurring: boolean;
  recurringInterval?: number;
  recurringEndDate?: Date;
}

interface VaccinationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flocks?: Flock[];
  flocksLoading?: boolean;
  veterinarians?: Staff[];
  veterinariansLoading?: boolean;
  initialData?: VaccinationData;
  onSuccess?: () => void;
  loading?: boolean;
  onLoadingChange?: (loading: boolean) => void;
}

export function VaccinationDialog({
  open,
  onOpenChange,
  flocks: propFlocks,
  flocksLoading: propFlocksLoading = false,
  veterinarians: propVeterinarians,
  veterinariansLoading: propVeterinariansLoading = false,
  initialData,
  onSuccess,
  loading = false,
  onLoadingChange
}: VaccinationDialogProps) {
  
  const t = useTranslations('health.vaccination');
  const tCommon = useTranslations('common');
  
  const [flocks, setFlocks] = useState<Flock[]>(propFlocks || []);
  const [flocksLoading, setFlocksLoading] = useState(propFlocksLoading);
  const [veterinarians, setVeterinarians] = useState<Staff[]>(propVeterinarians || []);
  const [veterinariansLoading, setVeterinariansLoading] = useState(propVeterinariansLoading);

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

  useEffect(() => {
    if (open && !propVeterinarians) {
      const fetchVeterinarians = async () => {
        setVeterinariansLoading(true);
        try {
          const result = await getStaff();
          if (result.success && result.data) {
            const vets = result.data.filter((staff: any) => 
              staff.role === 'VETERINARIAN' || staff.role === 'ADMIN'
            );
            setVeterinarians(vets);
          } else {
            console.error("Failed to fetch veterinarians:", result.message);
            toast.error("Failed to fetch veterinarians");
            setVeterinarians([]);
          }
        } catch (error) {
          console.error("Error fetching veterinarians:", error);
          toast.error("Error fetching veterinarians");
          setVeterinarians([]);
        } finally {
          setVeterinariansLoading(false);
        }
      };
      fetchVeterinarians();
    }
  }, [open, propVeterinarians]);

  // Get default values based on initial data
  const getDefaultValues = (): z.infer<typeof vaccinationSchema> => {
    if (initialData) {
      return {
        vaccineName: initialData.vaccineName || "",
        flockId: initialData.flockId || "",
        administeredDate: initialData.administeredDate || undefined,
        scheduledDate: initialData.scheduledDate || new Date(),
        quantity: initialData.quantity || 0,
        dosage: initialData.dosage || "",
        dosageUnit: initialData.dosageUnit || "",
        notes: initialData.notes || "",
        administrationMethod: initialData.administrationMethod || undefined,
        isScheduled: initialData.isScheduled ?? true,
        reminderEnabled: initialData.reminderEnabled ?? false,
        reminderDaysBefore: initialData.reminderDaysBefore || undefined,
        sendEmail: initialData.sendEmail ?? false,
        sendInAppAlert: initialData.sendInAppAlert ?? true,
        isRecurring: initialData.isRecurring ?? false,
        recurringInterval: initialData.recurringInterval || undefined,
        recurringEndDate: initialData.recurringEndDate || undefined,
      };
    }
    
    return {
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
      sendInAppAlert: true,
      isRecurring: false,
      recurringInterval: undefined,
      recurringEndDate: undefined,
    };
  };

  // Handle form submission
  const handleSubmit = async (data: any) => {
    if (onLoadingChange) {
      onLoadingChange(true);
    }
    
    try {
      // Prepare the vaccination data with proper type conversions
      const vaccinationData = {
        ...data,
        // Convert dates to ISO strings, handling null/undefined values
        administeredDate: data.administeredDate ? data.administeredDate.toISOString() : undefined,
        scheduledDate: data.scheduledDate ? data.scheduledDate.toISOString() : undefined,
        recurringEndDate: data.recurringEndDate ? data.recurringEndDate.toISOString() : undefined,
        // Handle optional number fields - convert null to undefined
        reminderDaysBefore: data.reminderDaysBefore || undefined,
        recurringInterval: data.recurringInterval || undefined,
      };

      let result;
      if (initialData?.id) {
        result = await updateVaccination(initialData.id, vaccinationData);
      } else {
        result = await createVaccination(vaccinationData);
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
      console.error("Error submitting vaccination:", error);
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
        schema: vaccinationSchema,
        defaultValues: getDefaultValues(),
        title: dialogConfig.title,
        description: dialogConfig.description,
        submitText: dialogConfig.submitText,
        cancelText: tCommon('cancel'),
        onSubmit: handleSubmit,
        maxWidth: "max-w-4xl",
        children: (form) => (
          <VaccinationForm 
            form={form} 
            flocks={flocks}
            veterinarians={veterinarians}
            flocksLoading={flocksLoading}
            veterinariansLoading={veterinariansLoading}
          />
        ),
      }}
      loading={loading}
    />
  );
}
