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
      const result = record
        ? await updateLightingRecord(record.id, data)
        : await createLightingRecord(data);

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t(record ? "editTitle" : "addTitle")}</DialogTitle>
          <DialogDescription>{t(record ? "editDescription" : "addDescription")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="flockId"
              rules={{ required: t("flockRequired") }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("flock")} <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectFlock")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {flocks.map((flock) => (
                        <SelectItem key={flock.id} value={flock.id}>
                          {flock.batchCode} ({flock.currentCount} birds)
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
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? field.value.toLocaleDateString() : t("pickDate")}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lightOnTime"
                rules={{ required: t("lightOnRequired") }}
                render={({ field }) => (
                  <FormItem>
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
                  <FormItem>
                    <FormLabel>{t("lightOffTime")} <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalHours"
                rules={{
                  required: t("totalHoursRequired"),
                  min: { value: 0, message: t("totalHoursRange") },
                  max: { value: 24, message: t("totalHoursRange") },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("totalHours")} <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="12"
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

              <FormField
                control={form.control}
                name="interruptedHours"
                render={({ field }) => (
                  <FormItem>
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

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t("saving") : record ? t("update") : t("add")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

