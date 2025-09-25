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
import { ExpenseDialog } from "@/app/(dashboard)/financial/components/expense-dialog";
import { RevenueDialog } from "@/app/(dashboard)/financial/components/revenue-dialog";
import { ExpenseFormData, RevenueFormData } from "@/features/financial/types";
import { createExpense, createRevenue } from "@/server/financial";
import { toast } from "sonner";

interface QuickActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: string | null;
}

export function QuickActionDialog({ isOpen, onClose, actionType }: QuickActionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isRevenueDialogOpen, setIsRevenueDialogOpen] = useState(false);

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
        flockId: "",
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
        flockId: "",
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
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
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
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="flock">Flock</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select flock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flock-1">Flock A - Broiler</SelectItem>
                  <SelectItem value="flock-2">Flock B - Layer</SelectItem>
                  <SelectItem value="flock-3">Flock C - Dual Purpose</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eggCount">Egg Count</Label>
                <Input id="eggCount" type="number" placeholder="1250" required />
              </div>
              <div>
                <Label htmlFor="grade">Grade</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="cracked">Cracked</SelectItem>
                    <SelectItem value="spoiled">Spoiled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="productionDate">Production Date</Label>
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
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
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
          </form>
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="John" required />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Doe" required />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john.doe@example.com" required />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" placeholder="+1 (555) 123-4567" required />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="veterinarian">Veterinarian</SelectItem>
                  <SelectItem value="worker">Worker</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
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
            {actionType === "add-expense" && "Add Expense"}
            {actionType === "add-revenue" && "Add Revenue"}
            {actionType === "add-staff" && "Add Staff Member"}
            {!["add-flock", "record-production", "add-expense", "add-revenue", "add-staff"].includes(actionType || "") && "Quick Action"}
          </DialogTitle>
          <DialogDescription>
            {actionType === "add-flock" && "Register a new flock batch in your system."}
            {actionType === "record-production" && "Log daily egg production data."}
            {actionType === "add-expense" && "Record a new farm expense."}
            {actionType === "add-revenue" && "Record a new farm revenue."}
            {actionType === "add-staff" && "Add a new staff member to your team."}
            {!["add-flock", "record-production", "add-expense", "add-revenue", "add-staff"].includes(actionType || "") && "Complete this action quickly."}
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
            {actionType === "record-production" && "Record Production"}
            {actionType === "add-expense" && "Add Expense"}
            {actionType === "add-revenue" && "Add Revenue"}
            {actionType === "add-staff" && "Add Staff"}
            {!["add-flock", "record-production", "add-expense", "add-revenue", "add-staff"].includes(actionType || "") && "Submit"}
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
    </Dialog>
  );
}
