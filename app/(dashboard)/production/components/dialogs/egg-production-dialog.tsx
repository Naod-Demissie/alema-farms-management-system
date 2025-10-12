"use client";

import React from "react";
import { ProductionDialog } from "@/app/(dashboard)/production/components/dialogs/production-dialog";
import { useProductionDialog } from "../shared/use-production-dialog";

interface EggProductionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: any;
}

export function EggProductionDialog({
  open,
  onOpenChange,
  onSuccess,
  initialData
}: EggProductionDialogProps) {
  const { flocks, flocksLoading } = useProductionDialog(open);

  return (
    <ProductionDialog
      open={open}
      onOpenChange={onOpenChange}
      productionType="eggs"
      flocks={flocks}
      flocksLoading={flocksLoading}
      initialData={initialData}
      onSuccess={onSuccess}
    />
  );
}
