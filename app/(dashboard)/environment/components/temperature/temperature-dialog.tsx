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
import { createTemperatureRecord, updateTemperatureRecord } from "../../server/temperature";
import { getFlocks } from "@/app/(dashboard)/flocks/server/flocks";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";

type FormData = {
  flockId: string;
  date: Date;
  minTemp: number;
  maxTemp: number;
  notes?: string;
};

type TemperatureDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  record?: any;
};

export function TemperatureDialog({ open, onOpenChange, onSuccess, record }: TemperatureDialogProps) {
  const t = useTranslations("environment.temperature");
  const [loading, setLoading] = useState(false);
  const [flocks, setFlocks] = useState<Array<{ id: string; batchCode: string; currentCount: number }>>([]);
  
  const form = useForm<FormData>({
    defaultValues: {
      flockId: record?.flockId || "",
      date: record?.date ? new Date(record.date) : new Date(),
      minTemp: record?.minTemp || 0,
      maxTemp: record?.maxTemp || 0,
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
        minTemp: record.minTemp,
        maxTemp: record.maxTemp,
        notes: record.notes || "",
      });
    } else {
      form.reset({
        flockId: "",
        date: new Date(),
        minTemp: 0,
        maxTemp: 0,
        notes: "",
      });
    }
  }, [record, form]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const result = record
        ? await updateTemperatureRecord(record.id, data)
        : await createTemperatureRecord(data);

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
        <DialogHeader className="text-center">
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

            {/* Temperature fields - responsive layout */}
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <FormField
                control={form.control}
                name="minTemp"
                rules={{
                  required: t("minTempRequired"),
                  validate: (value) => {
                    const stringValue = String(value || '');
                    if (!value || stringValue.trim() === '') {
                      return t("minTempRequired");
                    }
                    const numValue = Number(value);
                    if (isNaN(numValue)) {
                      return t("minTempRange");
                    }
                    if (numValue < -50 || numValue > 100) {
                      return t("minTempRange");
                    }
                    return true;
                  }
                }}
                render={({ field }) => (
                  <FormItem className="w-full sm:flex-1">
                    <FormLabel>{t("minTemp")} <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            field.onChange('');
                          } else {
                            const numValue = parseFloat(value);
                            field.onChange(isNaN(numValue) ? '' : numValue);
                          }
                          // Clear any existing validation errors
                          form.clearErrors('minTemp');
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
                name="maxTemp"
                rules={{
                  required: t("maxTempRequired"),
                  validate: (value) => {
                    const stringValue = String(value || '');
                    if (!value || stringValue.trim() === '') {
                      return t("maxTempRequired");
                    }
                    const numValue = Number(value);
                    if (isNaN(numValue)) {
                      return t("maxTempRange");
                    }
                    if (numValue < -50 || numValue > 100) {
                      return t("maxTempRange");
                    }
                    return true;
                  }
                }}
                render={({ field }) => (
                  <FormItem className="w-full sm:flex-1">
                    <FormLabel>{t("maxTemp")} <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            field.onChange('');
                          } else {
                            const numValue = parseFloat(value);
                            field.onChange(isNaN(numValue) ? '' : numValue);
                          }
                          // Clear any existing validation errors
                          form.clearErrors('maxTemp');
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

