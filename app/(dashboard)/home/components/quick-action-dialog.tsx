"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ExpenseDialog } from "@/app/(dashboard)/financial/components/expenses/expense-dialog";
import { RevenueDialog } from "@/app/(dashboard)/financial/components/revenue/revenue-dialog";
import { EggProductionDialog } from "@/app/(dashboard)/production/components/dialogs/egg-production-dialog";
import { BroilerProductionDialog } from "@/app/(dashboard)/production/components/dialogs/broiler-production-dialog";
import { ManureProductionDialog } from "@/app/(dashboard)/production/components/dialogs/manure-production-dialog";
import { AddStaffDialog } from "@/app/(dashboard)/staff/components/directory/add-staff-dialog";
import { ExpenseFormData, RevenueFormData } from "@/app/(dashboard)/financial/types/types";
import { createExpense, createRevenue } from "@/app/(dashboard)/financial/server/financial";
import { createNonSystemStaff } from "@/app/(dashboard)/staff/server/staff-invites";
import { toast } from "sonner";

interface QuickActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: string | null;
  onRefresh?: () => void;
}

export function QuickActionDialog({ isOpen, onClose, actionType, onRefresh }: QuickActionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isRevenueDialogOpen, setIsRevenueDialogOpen] = useState(false);
  const [isEggProductionDialogOpen, setIsEggProductionDialogOpen] = useState(false);
  const [isBroilerProductionDialogOpen, setIsBroilerProductionDialogOpen] = useState(false);
  const [isManureProductionDialogOpen, setIsManureProductionDialogOpen] = useState(false);
  const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = useState(false);

  // Open expense dialog directly when actionType is "add-expense"
  React.useEffect(() => {
    if (isOpen && actionType === "add-expense") {
      setIsExpenseDialogOpen(true);
    }
  }, [isOpen, actionType]);

  // Open revenue dialog directly when actionType is "add-revenue"
  React.useEffect(() => {
    if (isOpen && actionType === "add-revenue") {
      setIsRevenueDialogOpen(true);
    }
  }, [isOpen, actionType]);

  // Open production dialogs directly when actionType is a production type
  React.useEffect(() => {
    if (isOpen && actionType && actionType.startsWith("record-") && actionType.includes("production")) {
      if (actionType === "record-production") {
        setIsEggProductionDialogOpen(true);
      } else if (actionType === "record-broiler-production") {
        setIsBroilerProductionDialogOpen(true);
      } else if (actionType === "record-manure-production") {
        setIsManureProductionDialogOpen(true);
      }
    }
  }, [isOpen, actionType]);

  // Open staff dialog directly when actionType is "add-staff"
  React.useEffect(() => {
    if (isOpen && actionType === "add-staff") {
      setIsAddStaffDialogOpen(true);
    }
  }, [isOpen, actionType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsLoading(false);
    onClose();
  };

  const handleExpenseSubmit = async (data: ExpenseFormData) => {
    try {
      const result = await createExpense({
        category: data.category,
        quantity: data.quantity,
        costPerQuantity: data.costPerQuantity,
        amount: data.amount,
        date: data.date,
        description: data.description,
      });

      if (result.success) {
        toast.success("Expense created successfully");
        setIsExpenseDialogOpen(false);
        onClose();
      } else {
        toast.error(result.message || "Failed to create expense");
      }
    } catch (error) {
      console.error("Error creating expense:", error);
      toast.error("Failed to create expense");
    }
  };

  const handleRevenueSubmit = async (data: RevenueFormData) => {
    try {
      const result = await createRevenue({
        source: data.source,
        quantity: data.quantity,
        costPerQuantity: data.costPerQuantity,
        amount: data.amount,
        date: data.date,
        description: data.description,
      });

      if (result.success) {
        toast.success("Revenue created successfully");
        setIsRevenueDialogOpen(false);
        onClose();
      } else {
        toast.error(result.message || "Failed to create revenue");
      }
    } catch (error) {
      console.error("Error creating revenue:", error);
      toast.error("Failed to create revenue");
    }
  };

  const handleStaffSubmit = async (data: any) => {
    try {
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
        setIsAddStaffDialogOpen(false);
        onClose();
        onRefresh?.();
      } else {
        toast.error(result.message || "Failed to add staff member");
        throw new Error(result.message || "Failed to add staff member");
      }
    } catch (error) {
      console.error("Error adding staff member:", error);
      toast.error("Failed to add staff member");
    }
  };

  const renderForm = () => {
    switch (actionType) {
      case "add-flock":
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="batchCode">Batch Code</Label>
                <Input id="batchCode" placeholder="FLK-2024-001" required />
              </div>
              <div>
                <Label htmlFor="breed">Breed</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select breed" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="broiler">Broiler</SelectItem>
                    <SelectItem value="layer">Layer</SelectItem>
                    <SelectItem value="dual_purpose">Dual Purpose</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="initialCount">Initial Count</Label>
                <Input id="initialCount" type="number" placeholder="1000" required />
              </div>
              <div>
                <Label htmlFor="source">Source</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hatchery">Hatchery</SelectItem>
                    <SelectItem value="farm">Farm</SelectItem>
                    <SelectItem value="imported">Imported</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="arrivalDate">Arrival Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Additional notes..." />
            </div>
          </form>
        );

      case "record-production":
      case "record-broiler-production":
      case "record-manure-production":
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Opening production recording form...</p>
          </div>
        );

      case "add-expense":
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Opening expense form...</p>
          </div>
        );

      case "add-revenue":
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Opening revenue form...</p>
          </div>
        );

      case "add-staff":
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Opening staff form...</p>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Quick action form coming soon...</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {actionType === "add-flock" && "Add New Flock"}
            {actionType === "record-production" && "Record Egg Production"}
            {actionType === "record-broiler-production" && "Record Broiler Production"}
            {actionType === "record-manure-production" && "Record Manure Production"}
            {actionType === "add-expense" && "Add Expense"}
            {actionType === "add-revenue" && "Add Revenue"}
            {actionType === "add-staff" && "Add Staff Member"}
            {!["add-flock", "record-production", "record-broiler-production", "record-manure-production", "add-expense", "add-revenue", "add-staff"].includes(actionType || "") && "Quick Action"}
          </DialogTitle>
          <DialogDescription>
            {actionType === "add-flock" && "Register a new flock batch in your system."}
            {actionType === "record-production" && "Log daily egg production data."}
            {actionType === "record-broiler-production" && "Record broiler production and sales data."}
            {actionType === "record-manure-production" && "Record manure production from your flocks."}
            {actionType === "add-expense" && "Record a new farm expense."}
            {actionType === "add-revenue" && "Record a new farm revenue."}
            {actionType === "add-staff" && "Add a new staff member to your team."}
            {!["add-flock", "record-production", "record-broiler-production", "record-manure-production", "add-expense", "add-revenue", "add-staff"].includes(actionType || "") && "Complete this action quickly."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {renderForm()}
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {actionType === "add-flock" && "Add Flock"}
            {actionType === "record-production" && "Record Egg Production"}
            {actionType === "record-broiler-production" && "Record Broiler Production"}
            {actionType === "record-manure-production" && "Record Manure Production"}
            {actionType === "add-expense" && "Add Expense"}
            {actionType === "add-revenue" && "Add Revenue"}
            {actionType === "add-staff" && "Add Staff"}
            {!["add-flock", "record-production", "record-broiler-production", "record-manure-production", "add-expense", "add-revenue", "add-staff"].includes(actionType || "") && "Submit"}
          </Button>
        </div>
      </DialogContent>

      {/* Reusable Expense Dialog */}
      <ExpenseDialog
        isOpen={isExpenseDialogOpen}
        onClose={() => {
          setIsExpenseDialogOpen(false);
          onClose();
        }}
        onSubmit={handleExpenseSubmit}
        title="Add New Expense"
        description="Record a new expense for your farm"
        submitButtonText="Add Expense"
      />

      {/* Reusable Revenue Dialog */}
      <RevenueDialog
        isOpen={isRevenueDialogOpen}
        onClose={() => {
          setIsRevenueDialogOpen(false);
          onClose();
        }}
        onSubmit={handleRevenueSubmit}
        title="Add New Revenue"
        description="Record a new revenue for your farm"
        submitButtonText="Add Revenue"
      />

      {/* Reusable Production Dialogs */}
      <EggProductionDialog
        open={isEggProductionDialogOpen}
        onOpenChange={(open) => {
          setIsEggProductionDialogOpen(open);
          if (!open) {
            onClose();
          }
        }}
        onSuccess={() => {
          setIsEggProductionDialogOpen(false);
          onClose();
          onRefresh?.();
        }}
      />

      <BroilerProductionDialog
        open={isBroilerProductionDialogOpen}
        onOpenChange={(open) => {
          setIsBroilerProductionDialogOpen(open);
          if (!open) {
            onClose();
          }
        }}
        onSuccess={() => {
          setIsBroilerProductionDialogOpen(false);
          onClose();
          onRefresh?.();
        }}
      />

      <ManureProductionDialog
        open={isManureProductionDialogOpen}
        onOpenChange={(open) => {
          setIsManureProductionDialogOpen(open);
          if (!open) {
            onClose();
          }
        }}
        onSuccess={() => {
          setIsManureProductionDialogOpen(false);
          onClose();
          onRefresh?.();
        }}
      />

      {/* Reusable Add Staff Dialog */}
      <AddStaffDialog
        isOpen={isAddStaffDialogOpen}
        onClose={() => {
          setIsAddStaffDialogOpen(false);
          onClose();
        }}
        onSubmit={handleStaffSubmit}
        title="Add Staff Member"
        description="Add a new worker to your team."
        submitButtonText="Add Staff Member"
      />
    </Dialog>
  );
}
