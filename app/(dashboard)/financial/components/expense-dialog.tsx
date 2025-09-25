"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { ExpenseFormData, EXPENSE_CATEGORIES } from "@/features/financial/types";
import { ExpenseCategory } from "@/lib/generated/prisma";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  initialData?: ExpenseFormData;
  title?: string;
  description?: string;
  submitButtonText?: string;
}

export function ExpenseDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title = "Add New Expense",
  description = "Record a new expense for your farm",
  submitButtonText = "Add Expense"
}: ExpenseDialogProps) {
  const [formData, setFormData] = useState<ExpenseFormData>(
    initialData || {
      flockId: "",
      category: "feed",
      quantity: 0,
      costPerQuantity: 0,
      amount: 0,
      date: new Date(),
      description: "",
    }
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(formData.date);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.category || !formData.quantity || !formData.costPerQuantity) {
      return;
    }

    // Calculate total amount
    const calculatedAmount = formData.quantity * formData.costPerQuantity;
    const dataToSubmit = {
      ...formData,
      amount: calculatedAmount,
    };

    setIsLoading(true);
    try {
      await onSubmit(dataToSubmit);
      onClose();
    } catch (error) {
      console.error("Error submitting expense:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setFormData({ ...formData, date });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* First row: Date and Category */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date" className="flex items-center gap-1">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      {formData.date ? (
                        format(formData.date, "MMM dd, yyyy")
                      ) : (
                        <span>Select date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category" className="flex items-center gap-1">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as ExpenseCategory })}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Second row: Quantity and Cost per Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity" className="flex items-center gap-1">
                  Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.quantity || ""}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 100"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="costPerQuantity" className="flex items-center gap-1">
                  Cost per Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="costPerQuantity"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.costPerQuantity || ""}
                  onChange={(e) => setFormData({ ...formData, costPerQuantity: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 2.50"
                  required
                />
              </div>
            </div>

            {/* Total Amount Display */}
            <div className="grid gap-2">
              <Label htmlFor="amount">Total Amount</Label>
              <div className="bg-muted/50 p-3 rounded-lg text-center">
                <div className="text-sm text-muted-foreground mb-1">Total Amount</div>
                <div className="text-xl font-semibold">
                  {formData.quantity && formData.costPerQuantity 
                    ? new Intl.NumberFormat("en-ET", {
                        style: "currency",
                        currency: "ETB",
                      }).format(formData.quantity * formData.costPerQuantity)
                    : "0.00 ETB"
                  }
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details about this expense..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {submitButtonText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
