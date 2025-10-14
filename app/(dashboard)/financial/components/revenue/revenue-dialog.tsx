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
import { RevenueFormData, REVENUE_SOURCES, BANK_NAMES } from "../../types/types";
import { RevenueSource, BankName } from "@/lib/generated/prisma/enums";
import { format } from "date-fns";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";
import { cn } from "@/lib/utils";

interface RevenueDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RevenueFormData) => Promise<void>;
  initialData?: RevenueFormData;
  title?: string;
  description?: string;
  submitButtonText?: string;
}

export function RevenueDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
  description,
  submitButtonText
}: RevenueDialogProps) {
  const t = useTranslations('financial.revenue');
  const tCommon = useTranslations('financial.common');
  
  const dialogTitle = title || (initialData ? t('dialog.editTitle') : t('dialog.addTitle'));
  const dialogDescription = description || (initialData ? t('dialog.editDescription') : t('dialog.addDescription'));
  const dialogSubmitText = submitButtonText || (initialData ? t('dialog.updateButton') : t('dialog.addButton'));
  const [formData, setFormData] = useState<RevenueFormData>(
    initialData || {
      source: "egg_sales",
      quantity: 0,
      costPerQuantity: 0,
      amount: 0,
      date: new Date(),
      description: "",
      transactionBy: "",
      bankName: undefined,
      bankAccountNumber: "",
    }
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(formData.date);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form data when dialog opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      const defaultData = {
        source: "egg_sales",
        quantity: 0,
        costPerQuantity: 0,
        amount: 0,
        date: new Date(),
        description: "",
        transactionBy: "",
        bankName: undefined,
        bankAccountNumber: "",
      };
      
      setFormData(initialData || defaultData);
      setSelectedDate(initialData?.date || new Date());
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.source || !formData.quantity || !formData.costPerQuantity) {
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
      console.error("Error submitting revenue:", error);
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* First row: Date and Source */}
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
                <Label htmlFor="source" className="flex items-center gap-1">
                  {t('form.source')} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => setFormData({ ...formData, source: value as RevenueSource })}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('form.sourcePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {REVENUE_SOURCES.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
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

            {/* Third row: Bank Name and Bank Account Number */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bankName">{t('form.bankName')}</Label>
                <Select
                  value={formData.bankName || ""}
                  onValueChange={(value) => setFormData({ ...formData, bankName: value as BankName })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('form.bankNamePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto">
                    {BANK_NAMES.map((bank) => (
                      <SelectItem key={bank.value} value={bank.value}>
                        {bank.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bankAccountNumber">{t('form.bankAccountNumber')}</Label>
                <Input
                  id="bankAccountNumber"
                  type="text"
                  value={formData.bankAccountNumber || ""}
                  onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                  placeholder={t('form.bankAccountNumberPlaceholder')}
                />
              </div>
            </div>

            {/* Fourth row: Transaction By (Full width) */}
            <div className="grid gap-2">
              <Label htmlFor="transactionBy">{t('form.transactionBy')}</Label>
              <Input
                id="transactionBy"
                type="text"
                value={formData.transactionBy || ""}
                onChange={(e) => setFormData({ ...formData, transactionBy: e.target.value })}
                placeholder={t('form.transactionByPlaceholder')}
              />
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
