"use client";

import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { ReusableDialog } from "@/components/ui/reusable-dialog";
import { MortalityForm, mortalitySchema } from "@/components/forms/mortality-form";
import { 
  createMortalityRecord,
  updateMortalityRecord
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

// Mortality data interface
interface MortalityData {
  id?: string;
  flockId: string;
  date: Date;
  count: number;
  cause: "disease" | "injury" | "environmental" | "unknown";
  causeDescription: string;
}

interface MortalityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flocks?: Flock[];
  flocksLoading?: boolean;
  initialData?: MortalityData;
  onSuccess?: () => void;
  loading?: boolean;
  onLoadingChange?: (loading: boolean) => void;
}

export function MortalityDialog({
  open,
  onOpenChange,
  flocks: propFlocks,
  flocksLoading: propFlocksLoading = false,
  initialData,
  onSuccess,
  loading = false,
  onLoadingChange
}: MortalityDialogProps) {
  
  const t = useTranslations('health.mortality');
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
        date: initialData.date || new Date(),
        count: initialData.count || 0,
        cause: initialData.cause || "disease",
        causeDescription: initialData.causeDescription || "",
      };
    }
    
    return {
      flockId: "",
      date: new Date(),
      count: 0,
      cause: "disease" as const,
      causeDescription: "",
    };
  };

  // Handle form submission
  const handleSubmit = async (data: any) => {
    if (onLoadingChange) {
      onLoadingChange(true);
    }
    
    try {
      const mortalityData = {
        ...data,
        date: data.date.toISOString(),
      };

      let result;
      if (initialData?.id) {
        result = await updateMortalityRecord(initialData.id, mortalityData);
      } else {
        result = await createMortalityRecord(mortalityData);
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
      console.error("Error submitting mortality record:", error);
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
        schema: mortalitySchema,
        defaultValues: getDefaultValues(),
        title: dialogConfig.title,
        description: dialogConfig.description,
        submitText: dialogConfig.submitText,
        cancelText: tCommon('cancel'),
        onSubmit: handleSubmit,
        maxWidth: "max-w-3xl",
        children: (form) => (
          <MortalityForm 
            form={form} 
            flocks={flocks}
            flocksLoading={flocksLoading}
          />
        ),
      }}
      loading={loading}
    />
  );
}
