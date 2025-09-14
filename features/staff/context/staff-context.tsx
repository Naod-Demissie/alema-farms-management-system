"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Staff } from "../data/schema";

interface StaffContextType {
  selectedStaff: Staff | null;
  setSelectedStaff: (staff: Staff | null) => void;
  isInviteDialogOpen: boolean;
  setIsInviteDialogOpen: (open: boolean) => void;
  isAddStaffDialogOpen: boolean;
  setIsAddStaffDialogOpen: (open: boolean) => void;
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
  isDeleteDialogOpen: boolean;
  setIsDeleteDialogOpen: (open: boolean) => void;
  refreshStaff: () => void;
  setRefreshStaff: (refresh: () => void) => void;
  refreshInvites: () => void;
  setRefreshInvites: (refresh: () => void) => void;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export function useStaff() {
  const context = useContext(StaffContext);
  if (context === undefined) {
    throw new Error("useStaff must be used within a StaffProvider");
  }
  return context;
}

interface StaffProviderProps {
  children: ReactNode;
}

export default function StaffProvider({ children }: StaffProviderProps) {
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [refreshStaff, setRefreshStaff] = useState<() => void>(() => () => {});
  const [refreshInvites, setRefreshInvites] = useState<() => void>(() => () => {});

  const value: StaffContextType = {
    selectedStaff,
    setSelectedStaff,
    isInviteDialogOpen,
    setIsInviteDialogOpen,
    isAddStaffDialogOpen,
    setIsAddStaffDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    refreshStaff,
    setRefreshStaff,
    refreshInvites,
    setRefreshInvites,
  };

  return (
    <StaffContext.Provider value={value}>
      {children}
    </StaffContext.Provider>
  );
}

