"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { EthiopianCalendar } from "@/components/ui/ethiopian-calendar";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";
import { cn } from "@/lib/utils";

interface WaterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WaterFormData) => Promise<void>;
  flocks: any[];
  flocksLoading?: boolean;
  initialData?: any;
}

interface WaterFormData {
  flockId: string;
  date: Date;
  consumption: number;
  notes: string;
}

export function WaterDialog({
  isOpen,
  onClose,
  onSubmit,
  flocks,
  flocksLoading = false,
  initialData,
}: WaterDialogProps) {
  const t = useTranslations('feed.water');
  
  const [formData, setFormData] = useState<WaterFormData>({
    flockId: "",
    date: new Date(),
    consumption: 0,
    notes: "",
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          flockId: initialData.flockId,
          date: new Date(initialData.date),
          consumption: initialData.consumption,
          notes: initialData.notes || "",
        });
        setSelectedDate(new Date(initialData.date));
      } else {
        setFormData({
          flockId: "",
          date: new Date(),
          consumption: 0,
          notes: "",
        });
        setSelectedDate(new Date());
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit({
        ...formData,
        date: selectedDate || new Date(),
      });
      onClose();
    } catch (error) {
      console.error("Error submitting water consumption:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof WaterFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const selectedFlock = flocks.find(f => f.id === formData.flockId);
  const perBirdConsumption = selectedFlock && formData.consumption > 0
    ? (formData.consumption / selectedFlock.currentCount).toFixed(2)
    : "0.00";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto sm:w-full mx-4 sm:mx-0">
        <DialogHeader>
          <DialogTitle>
            {initialData ? t('dialog.editTitle') : t('dialog.addTitle')}
          </DialogTitle>
          <DialogDescription>
            {initialData ? t('dialog.editDescription') : t('dialog.addDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Flock and Date Selection - Responsive Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Flock Selection */}
              <div className="grid gap-2">
                <Label htmlFor="flock">
                  {t('form.flockLabel')} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.flockId}
                  onValueChange={(value) => handleInputChange("flockId", value)}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('form.flockPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {flocksLoading ? (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading flocks...
                        </div>
                      </SelectItem>
                    ) : flocks.length === 0 ? (
                      <SelectItem value="no-flocks" disabled>
                        <div className="text-muted-foreground">{t('form.noFlocks')}</div>
                      </SelectItem>
                    ) : (
                      flocks.map((flock) => (
                        <SelectItem key={flock.id} value={flock.id}>
                          {flock.batchCode} ({flock.currentCount} {t('form.birds')})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              <div className="grid gap-2">
                <Label htmlFor="date">
                  {t('form.dateLabel')} <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      {selectedDate ? (
                        EthiopianDateFormatter.formatForForm(selectedDate)
                      ) : (
                        <span>{t('form.datePlaceholder')}</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                  <EthiopianCalendar
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                  />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Consumption Input */}
            <div className="grid gap-2">
              <Label htmlFor="consumption">
                {t('form.consumptionLabel')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="consumption"
                type="number"
                step="0.1"
                min="0"
                placeholder={t('form.consumptionPlaceholder')}
                value={formData.consumption || ""}
                onChange={(e) => handleInputChange("consumption", parseFloat(e.target.value) || 0)}
                required
              />
              <p className="text-xs text-muted-foreground">
                {t('form.consumptionHelp')}
              </p>
            </div>

            {/* Consumption Summary */}
            {selectedFlock && formData.consumption > 0 && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-sm space-y-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="text-muted-foreground">{t('form.totalConsumption')}:</span>
                    <span className="font-medium">{formData.consumption} {t('form.liters')}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="text-muted-foreground">{t('form.perBird')}:</span>
                    <span className="font-medium">{perBirdConsumption} {t('form.litersPerBird')}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="text-muted-foreground">{t('form.flockSize')}:</span>
                    <span className="font-medium">{selectedFlock.currentCount} {t('form.birds')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">{t('form.notesLabel')}</Label>
              <Textarea
                id="notes"
                placeholder={t('form.notesPlaceholder')}
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              {t('dialog.cancelButton')}
            </Button>
            <Button type="submit" disabled={isLoading || !formData.flockId || !selectedDate} className="w-full sm:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? t('dialog.updateButton') : t('dialog.addButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

