"use client";

import { AddStaffDialog as ReusableAddStaffDialog } from "./add-staff-dialog";
import { useStaff } from "../../context/staff-context";
import { createNonSystemStaff } from "@/app/(dashboard)/staff/server/staff-invites";
import { toast } from "sonner";

export function AddStaffDialog() {
  const { isAddStaffDialogOpen, setIsAddStaffDialogOpen, refreshStaff } = useStaff();

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
      toast.success("Staff member added successfully!");
      // Refresh staff list to show the new member
      refreshStaff();
    } else {
      toast.error(result.message || "Failed to add staff member");
      throw new Error(result.message || "Failed to add staff member");
    }
  };

  return (
    <ReusableAddStaffDialog
      isOpen={isAddStaffDialogOpen}
      onClose={() => setIsAddStaffDialogOpen(false)}
      onSubmit={handleSubmit}
      title="Add Staff Member"
      description="Add a new worker to the system."
      submitButtonText="Add Staff Member"
    />
  );
}