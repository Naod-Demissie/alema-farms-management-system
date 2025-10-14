"use client";

import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { ExpenseFormData, EXPENSE_CATEGORIES } from "../../types/types";
import { ExpenseCategory } from "@/lib/generated/prisma/enums";
import { format } from "date-fns";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";
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
  title,
  description,
  submitButtonText
}: ExpenseDialogProps) {
  const t = useTranslations('financial.expenses');
  const tCommon = useTranslations('financial.common');
  
  const dialogTitle = title || (initialData ? t('dialog.editTitle') : t('dialog.addTitle'));
  const dialogDescription = description || (initialData ? t('dialog.editDescription') : t('dialog.addDescription'));
  const dialogSubmitText = submitButtonText || (initialData ? t('dialog.updateButton') : t('dialog.addButton'));
  const [formData, setFormData] = useState<ExpenseFormData>(
    initialData || {
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

  // Reset form data when dialog opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      const defaultData = {
        category: "feed",
        quantity: 0,
        costPerQuantity: 0,
        amount: 0,
        date: new Date(),
        description: "",
      };
      
      setFormData(initialData || defaultData);
      setSelectedDate(initialData?.date || new Date());
    }
  }, [isOpen, initialData]);

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
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* First row: Date and Category */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date" className="flex items-center gap-1">
                  {t('form.date')} <span className="text-red-500">*</span>
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
                        EthiopianDateFormatter.formatForTable(formData.date)
                      ) : (
                        <span>{t('form.datePlaceholder')}</span>
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
                  {t('form.category')} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as ExpenseCategory })}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('form.categoryPlaceholder')} />
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
                  {t('form.quantity')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.quantity === 0 ? "" : formData.quantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, quantity: value === "" ? 0 : parseFloat(value) || 0 });
                  }}
                  placeholder={t('form.quantityPlaceholder')}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="costPerQuantity" className="flex items-center gap-1">
                  {t('form.costPerQuantity')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="costPerQuantity"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.costPerQuantity === 0 ? "" : formData.costPerQuantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, costPerQuantity: value === "" ? 0 : parseFloat(value) || 0 });
                  }}
                  placeholder={t('form.costPerQuantityPlaceholder')}
                  required
                />
              </div>
            </div>

            {/* Total Amount Display */}
            <div className="grid gap-2">
              <div className="bg-muted/50 p-3 rounded-lg text-center">
                <div className="text-sm text-muted-foreground mb-1">{t('form.amount')}</div>
                <div className="text-xl font-semibold">
                  {formData.quantity && formData.costPerQuantity 
                    ? new Intl.NumberFormat("en-ET", {
                        style: "currency",
                        currency: "ETB",
                      }).format(formData.quantity * formData.costPerQuantity)
                    : `0.00 ${tCommon('birr')}`
                  }
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">{t('form.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('form.descriptionPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('dialog.cancelButton')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialogSubmitText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
