"use client";

import React from "react";
import { ProductionDialog } from "@/app/(dashboard)/production/components/dialogs/production-dialog";
import { useProductionDialog } from "../shared/use-production-dialog";

interface BroilerProductionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: any;
}

export function BroilerProductionDialog({
  open,
  onOpenChange,
  onSuccess,
  initialData
}: BroilerProductionDialogProps) {
  const { flocks, flocksLoading } = useProductionDialog(open);

  return (
    <ProductionDialog
      open={open}
      onOpenChange={onOpenChange}
      productionType="broiler"
      flocks={flocks}
      flocksLoading={flocksLoading}
      initialData={initialData}
      onSuccess={onSuccess}
    />
  );
}
