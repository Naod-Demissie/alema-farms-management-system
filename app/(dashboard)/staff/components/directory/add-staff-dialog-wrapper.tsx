"use client";

import { AddStaffDialog as ReusableAddStaffDialog } from "./add-staff-dialog";
import { useStaff } from "../../context/staff-context";
import { createNonSystemStaff } from "@/app/(dashboard)/staff/server/staff-invites";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function AddStaffDialog() {
  const { isAddStaffDialogOpen, setIsAddStaffDialogOpen, refreshStaff } = useStaff();
  const t = useTranslations('staff');

  const handleSubmit = async (data: any) => {
    const result = await createNonSystemStaff({
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber || "",
      image: data.image || "",
      role: "WORKER",
      isSystemUser: false,
    });
    
    if (result.success) {
      toast.success(t('directory.dialogs.add.successMessage'));
      // Refresh staff list to show the new member
      refreshStaff();
    } else {
      toast.error(result.message || t('directory.dialogs.add.errorMessage'));
      throw new Error(result.message || t('directory.dialogs.add.errorMessage'));
    }
  };

  return (
    <ReusableAddStaffDialog
      isOpen={isAddStaffDialogOpen}
      onClose={() => setIsAddStaffDialogOpen(false)}
      onSubmit={handleSubmit}
      title={t('directory.dialogs.add.title')}
      description={t('directory.dialogs.add.description')}
      submitButtonText={t('directory.dialogs.add.submit')}
    />
  );
}