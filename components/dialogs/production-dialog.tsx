"use client";

import React from "react";
import { z } from "zod";
import { ReusableDialog } from "@/components/ui/reusable-dialog";
import { ProductionForm, eggProductionSchema, broilerProductionSchema, manureProductionSchema } from "@/components/forms/production-forms";
import { 
  createEggProduction, 
  createBroilerProduction, 
  createManureProduction,
  updateEggProduction,
  updateBroilerProduction,
  updateManureProduction
} from "@/server/production";
import { toast } from "sonner";

// Flock interface
interface Flock {
  id: string;
  batchCode: string;
  currentCount: number;
}

// Production data interface
interface ProductionData {
  id?: string;
  flockId: string;
  date: Date;
  notes?: string;
  // Egg production fields
  totalCount?: number;
  gradeCounts?: {
    normal: number;
    cracked: number;
    spoiled: number;
  };
  // Broiler/Manure fields
  quantity?: number;
  pricePerUnit?: number;
  totalAmount?: number;
  buyer?: string;
}

interface ProductionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionType: 'eggs' | 'broiler' | 'manure';
  flocks: Flock[];
  flocksLoading?: boolean;
  initialData?: ProductionData;
  onSuccess?: () => void;
  loading?: boolean;
}

export function ProductionDialog({
  open,
  onOpenChange,
  productionType,
  flocks,
  flocksLoading = false,
  initialData,
  onSuccess,
  loading = false
}: ProductionDialogProps) {
  
  // Get the appropriate schema based on production type
  const getSchema = () => {
    switch (productionType) {
      case 'eggs':
        return eggProductionSchema;
      case 'broiler':
        return broilerProductionSchema;
      case 'manure':
        return manureProductionSchema;
      default:
        return eggProductionSchema;
    }
  };

  // Get default values based on production type and initial data
  const getDefaultValues = () => {
    const baseValues = {
      flockId: initialData?.flockId || "",
      date: initialData?.date || new Date(),
      notes: initialData?.notes || ""
    };

    if (productionType === 'eggs') {
      return {
        ...baseValues,
        normalCount: initialData?.gradeCounts?.normal || 0,
        crackedCount: initialData?.gradeCounts?.cracked || 0,
        spoiledCount: initialData?.gradeCounts?.spoiled || 0
      };
    } else {
      return {
        ...baseValues,
        quantity: initialData?.quantity || 0,
      };
    }
  };

  // Handle form submission
  const handleSubmit = async (data: any) => {
    try {
      const baseData = {
        flockId: data.flockId,
        date: data.date,
        notes: data.notes
      };

      const isUpdate = initialData?.id;
      let result;
      
      switch (productionType) {
        case 'eggs':
          const totalCount = data.normalCount + data.crackedCount + data.spoiledCount;
          const gradeCounts = {
            normal: data.normalCount,
            cracked: data.crackedCount,
            spoiled: data.spoiledCount
          };
          
          if (isUpdate) {
            result = await updateEggProduction(initialData.id!, {
              totalCount,
              gradeCounts,
              notes: data.notes
            });
          } else {
            result = await createEggProduction({
              ...baseData,
              totalCount,
              gradeCounts
            });
          }
          break;
        case 'broiler':
          if (isUpdate) {
            result = await updateBroilerProduction(initialData.id!, {
              quantity: data.quantity,
              notes: data.notes
            });
          } else {
            result = await createBroilerProduction({
              ...baseData,
              quantity: data.quantity
            });
          }
          break;
        case 'manure':
          if (isUpdate) {
            result = await updateManureProduction(initialData.id!, {
              quantity: data.quantity,
              notes: data.notes
            });
          } else {
            result = await createManureProduction({
              ...baseData,
              quantity: data.quantity
            });
          }
          break;
        default:
          throw new Error("Invalid production type");
      }

      if (result.success) {
        toast.success(`${isUpdate ? 'Updated' : 'Created'} ${productionType.charAt(0).toUpperCase() + productionType.slice(1)} production record successfully`);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(result.message || `Failed to ${isUpdate ? 'update' : 'create'} production record`);
      }
    } catch (error) {
      console.error("Error creating production record:", error);
      toast.error("An error occurred while creating the production record");
    }
  };

  // Get dialog title and description
  const getDialogConfig = () => {
    const isUpdate = !!initialData?.id;
    const typeLabels = {
      eggs: "Egg Production",
      broiler: "Broiler Production", 
      manure: "Manure Production"
    };

    return {
      title: `${isUpdate ? "Edit" : "Add"} ${typeLabels[productionType]}`,
      description: isUpdate 
        ? "Update the production record details below." 
        : "Add a new production record to your system.",
      submitText: isUpdate ? "Update" : "Add"
    };
  };

  const dialogConfig = getDialogConfig();

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      config={{
        schema: getSchema(),
        defaultValues: getDefaultValues(),
        title: dialogConfig.title,
        description: dialogConfig.description,
        submitText: dialogConfig.submitText,
        onSubmit: handleSubmit,
        maxWidth: productionType === 'eggs' ? "max-w-2xl" : "sm:max-w-[425px]",
        children: (form) => (
          <ProductionForm 
            form={form} 
            flocks={flocks}
            flocksLoading={flocksLoading}
            productionType={productionType}
          />
        ),
      }}
      loading={loading}
    />
  );
}
