"use client";

import React from "react";
import { ProductionDialog } from "@/components/dialogs/production-dialog";
import { useProductionDialog } from "@/components/hooks/use-production-dialog";

interface ManureProductionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: any;
}

export function ManureProductionDialog({
  open,
  onOpenChange,
  onSuccess,
  initialData
}: ManureProductionDialogProps) {
  const { flocks, flocksLoading } = useProductionDialog(open);

  return (
    <ProductionDialog
      open={open}
      onOpenChange={onOpenChange}
      productionType="manure"
      flocks={flocks}
      flocksLoading={flocksLoading}
      initialData={initialData}
      onSuccess={onSuccess}
    />
  );
}
