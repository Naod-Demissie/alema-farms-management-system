"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations('dashboard.quickActions');
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
        toast.success(t('expense.createSuccess'));
        setIsExpenseDialogOpen(false);
        onClose();
      } else {
        toast.error(result.message || t('expense.createError'));
      }
    } catch (error) {
      console.error("Error creating expense:", error);
      toast.error(t('expense.createError'));
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
        toast.success(t('revenue.createSuccess'));
        setIsRevenueDialogOpen(false);
        onClose();
      } else {
        toast.error(result.message || t('revenue.createError'));
      }
    } catch (error) {
      console.error("Error creating revenue:", error);
      toast.error(t('revenue.createError'));
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
        toast.success(t('staff.createSuccess'));
        setIsAddStaffDialogOpen(false);
        onClose();
        onRefresh?.();
      } else {
        toast.error(result.message || t('staff.createError'));
        throw new Error(result.message || t('staff.createError'));
      }
    } catch (error) {
      console.error("Error adding staff member:", error);
      toast.error(t('staff.createError'));
    }
  };

  const renderForm = () => {
    switch (actionType) {
      case "add-flock":
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="batchCode">{t('flock.batchCode')}</Label>
                <Input id="batchCode" placeholder={t('flock.batchCodePlaceholder')} required />
              </div>
              <div>
                <Label htmlFor="breed">{t('flock.breed')}</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t('flock.breedPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="broiler">{t('flock.broiler')}</SelectItem>
                    <SelectItem value="layer">{t('flock.layer')}</SelectItem>
                    <SelectItem value="dual_purpose">{t('flock.dualPurpose')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="initialCount">{t('flock.initialCount')}</Label>
                <Input id="initialCount" type="number" placeholder={t('flock.initialCountPlaceholder')} required />
              </div>
              <div>
                <Label htmlFor="source">{t('flock.source')}</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t('flock.sourcePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hatchery">{t('flock.hatchery')}</SelectItem>
                    <SelectItem value="farm">{t('flock.farm')}</SelectItem>
                    <SelectItem value="imported">{t('flock.imported')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="arrivalDate">{t('flock.arrivalDate')}</Label>
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
                    {selectedDate ? format(selectedDate, "MMM dd, yyyy") : t('flock.pickDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="notes">{t('flock.notes')}</Label>
              <Textarea id="notes" placeholder={t('flock.notesPlaceholder')} />
            </div>
          </form>
        );

      case "record-production":
      case "record-broiler-production":
      case "record-manure-production":
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t('loading.production')}</p>
          </div>
        );

      case "add-expense":
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t('loading.expense')}</p>
          </div>
        );

      case "add-revenue":
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t('loading.revenue')}</p>
          </div>
        );

      case "add-staff":
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t('loading.staff')}</p>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t('loading.comingSoon')}</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {actionType === "add-flock" && t('titles.addFlock')}
            {actionType === "record-production" && t('titles.recordProduction')}
            {actionType === "record-broiler-production" && t('titles.recordBroilerProduction')}
            {actionType === "record-manure-production" && t('titles.recordManureProduction')}
            {actionType === "add-expense" && t('titles.addExpense')}
            {actionType === "add-revenue" && t('titles.addRevenue')}
            {actionType === "add-staff" && t('titles.addStaff')}
            {!["add-flock", "record-production", "record-broiler-production", "record-manure-production", "add-expense", "add-revenue", "add-staff"].includes(actionType || "") && t('titles.quickAction')}
          </DialogTitle>
          <DialogDescription>
            {actionType === "add-flock" && t('descriptions.addFlock')}
            {actionType === "record-production" && t('descriptions.recordProduction')}
            {actionType === "record-broiler-production" && t('descriptions.recordBroilerProduction')}
            {actionType === "record-manure-production" && t('descriptions.recordManureProduction')}
            {actionType === "add-expense" && t('descriptions.addExpense')}
            {actionType === "add-revenue" && t('descriptions.addRevenue')}
            {actionType === "add-staff" && t('descriptions.addStaff')}
            {!["add-flock", "record-production", "record-broiler-production", "record-manure-production", "add-expense", "add-revenue", "add-staff"].includes(actionType || "") && t('descriptions.quickAction')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {renderForm()}
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('buttons.cancel')}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {actionType === "add-flock" && t('buttons.addFlock')}
            {actionType === "record-production" && t('buttons.recordProduction')}
            {actionType === "record-broiler-production" && t('buttons.recordBroilerProduction')}
            {actionType === "record-manure-production" && t('buttons.recordManureProduction')}
            {actionType === "add-expense" && t('buttons.addExpense')}
            {actionType === "add-revenue" && t('buttons.addRevenue')}
            {actionType === "add-staff" && t('buttons.addStaff')}
            {!["add-flock", "record-production", "record-broiler-production", "record-manure-production", "add-expense", "add-revenue", "add-staff"].includes(actionType || "") && t('buttons.submit')}
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
      />

      {/* Reusable Revenue Dialog */}
      <RevenueDialog
        isOpen={isRevenueDialogOpen}
        onClose={() => {
          setIsRevenueDialogOpen(false);
          onClose();
        }}
        onSubmit={handleRevenueSubmit}
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
      />
    </Dialog>
  );
}
