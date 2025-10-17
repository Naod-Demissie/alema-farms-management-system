"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useTranslations } from "next-intl";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";
import { createLightingRecord, updateLightingRecord } from "../../server/lighting";
import { getFlocks } from "@/app/(dashboard)/flocks/server/flocks";

type FormData = {
  flockId: string;
  date: Date;
  lightOnTime: string;
  lightOffTime: string;
  totalHours: number;
  interruptedHours?: number;
  notes?: string;
};

type LightingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  record?: any;
};

export function LightingDialog({ open, onOpenChange, onSuccess, record }: LightingDialogProps) {
  const t = useTranslations("environment.lighting");
  const [loading, setLoading] = useState(false);
  const [flocks, setFlocks] = useState<Array<{ id: string; batchCode: string; currentCount: number }>>([]);
  
  const form = useForm<FormData>({
    defaultValues: {
      flockId: record?.flockId || "",
      date: record?.date ? new Date(record.date) : new Date(),
      lightOnTime: record?.lightOnTime || "06:00",
      lightOffTime: record?.lightOffTime || "18:00",
      totalHours: record?.totalHours || 12,
      interruptedHours: record?.interruptedHours || 0,
      notes: record?.notes || "",
    },
  });

  useEffect(() => {
    const fetchFlocks = async () => {
      try {
        const result = await getFlocks();
        if (result.success && result.data) {
          setFlocks(result.data);
        }
      } catch (error) {
        console.error("Error fetching flocks:", error);
      }
    };

    if (open) {
      fetchFlocks();
    }
  }, [open]);

  useEffect(() => {
    if (record) {
      form.reset({
        flockId: record.flockId,
        date: new Date(record.date),
        lightOnTime: record.lightOnTime,
        lightOffTime: record.lightOffTime,
        totalHours: record.totalHours,
        interruptedHours: record.interruptedHours || 0,
        notes: record.notes || "",
      });
    } else {
      form.reset({
        flockId: "",
        date: new Date(),
        lightOnTime: "06:00",
        lightOffTime: "18:00",
        totalHours: 12,
        interruptedHours: 0,
        notes: "",
      });
    }
  }, [record, form]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Calculate total hours automatically
      const lightOnTime = data.lightOnTime;
      const lightOffTime = data.lightOffTime;
      const interruptedHours = data.interruptedHours || 0;
      
      let calculatedTotalHours = 0;
      if (lightOnTime && lightOffTime) {
        const onTime = new Date(`2000-01-01T${lightOnTime}`);
        const offTime = new Date(`2000-01-01T${lightOffTime}`);
        
        // Calculate total hours between on and off time
        let totalHours = (offTime.getTime() - onTime.getTime()) / (1000 * 60 * 60);
        if (totalHours < 0) {
          totalHours += 24; // Add 24 hours if it's the next day
        }
        
        // Subtract interrupted hours
        calculatedTotalHours = Math.max(0, totalHours - interruptedHours);
      }
      
      // Update the data with calculated total hours
      const updatedData = {
        ...data,
        totalHours: calculatedTotalHours
      };

      const result = record
        ? await updateLightingRecord(record.id, updatedData)
        : await createLightingRecord(updatedData);

      if (result.success) {
        toast.success(t(record ? "updateSuccess" : "createSuccess"));
        onSuccess();
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(result.error || t("unexpectedError"));
      }
    } catch (error) {
      toast.error(t("unexpectedError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 sm:mx-0">
        <DialogHeader>
          <DialogTitle>{t(record ? "editTitle" : "addTitle")}</DialogTitle>
          <DialogDescription>{t(record ? "editDescription" : "addDescription")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Flock and Date fields - responsive layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="flockId"
                rules={{ required: t("flockRequired") }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("flock")} <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("selectFlock")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {flocks.map((flock) => (
                          <SelectItem key={flock.id} value={flock.id}>
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">{flock.batchCode}</span>
                              <span className="text-muted-foreground ml-2">
                                {flock.currentCount.toLocaleString()} birds
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                rules={{ required: t("dateRequired") }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("date")} <span className="text-red-500">*</span></FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              EthiopianDateFormatter.formatForTable(field.value)
                            ) : (
                              <span>{t("pickDate")}</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Lighting schedule - responsive layout */}
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <FormField
                control={form.control}
                name="lightOnTime"
                rules={{ required: t("lightOnRequired") }}
                render={({ field }) => (
                  <FormItem className="w-full sm:flex-1">
                    <FormLabel>{t("lightOnTime")} <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lightOffTime"
                rules={{ required: t("lightOffRequired") }}
                render={({ field }) => (
                  <FormItem className="w-full sm:flex-1">
                    <FormLabel>{t("lightOffTime")} <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interruptedHours"
                render={({ field }) => (
                  <FormItem className="w-full sm:flex-1">
                    <FormLabel>{t("interruptedHours")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="0"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                          field.onChange(value);
                        }}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Total hours display - similar to egg production dialog */}
            <div className="bg-muted/50 p-3 rounded-lg text-center">
              <div className="text-sm text-muted-foreground mb-1">{t("totalHours")}</div>
              <div className="text-xl font-semibold">
                {(() => {
                  const lightOnTime = form.watch("lightOnTime");
                  const lightOffTime = form.watch("lightOffTime");
                  const interruptedHours = form.watch("interruptedHours") || 0;
                  
                  if (!lightOnTime || !lightOffTime) return "0";
                  
                  // Calculate total hours between on and off time
                  const onTime = new Date(`2000-01-01T${lightOnTime}`);
                  const offTime = new Date(`2000-01-01T${lightOffTime}`);
                  
                  // Handle case where lights go off the next day
                  let totalHours = (offTime.getTime() - onTime.getTime()) / (1000 * 60 * 60);
                  if (totalHours < 0) {
                    totalHours += 24; // Add 24 hours if it's the next day
                  }
                  
                  // Subtract interrupted hours
                  const finalHours = Math.max(0, totalHours - interruptedHours);
                  
                  return finalHours.toFixed(1);
                })()}
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("notes")}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t("notesPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? t("saving") : record ? t("update") : t("add")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

