"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { 
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Validation schema
export const mortalitySchema = z.object({
  flockId: z.string().min(1, "Flock ID is required"),
  date: z.date({
    message: "Date is required",
  }),
  count: z.number().min(1, "Count must be at least 1"),
  cause: z.enum(["disease", "injury", "environmental", "unknown"]),
  causeDescription: z.string().min(1, "Cause description is required"),
});

interface MortalityFormProps {
  form: UseFormReturn<z.infer<typeof mortalitySchema>>;
  flocks: any[];
  flocksLoading?: boolean;
}

export function MortalityForm({ form, flocks, flocksLoading = false }: MortalityFormProps) {
  const t = useTranslations('health.mortality');

  return (
    <>
      {/* Row 1: Flock ID and Date */}
      <div className="flex flex-col sm:flex-row gap-4">
        <FormField
          control={form.control}
          name="flockId"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="flex items-center gap-1">
                {t('form.flockId')} <span className="text-red-500">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder={t('form.selectFlock')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {flocksLoading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('loadingFlocks')}
                      </div>
                    </SelectItem>
                  ) : flocks.length === 0 ? (
                    <SelectItem value="no-flocks" disabled>
                      <div className="text-muted-foreground">{t('noFlocks')}</div>
                    </SelectItem>
                  ) : (
                    flocks.map((flock: any) => (
                      <SelectItem key={flock.id} value={flock.id}>
                        {flock.batchCode} ({flock.currentCount} birds)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="flex items-center gap-1">
                {t('form.date')} <span className="text-red-500">*</span>
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full h-10 pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>{t('form.selectDate')}</span>
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

      {/* Row 2: Number of Deaths and Cause */}
      <div className="flex flex-col sm:flex-row gap-4">
        <FormField
          control={form.control}
          name="count"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="flex items-center gap-1">
                {t('form.count')} <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder={t('form.enterCount')}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cause"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="flex items-center gap-1">
                {t('form.cause')} <span className="text-red-500">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder={t('form.selectCause')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="disease">{t('causeTypes.disease')}</SelectItem>
                  <SelectItem value="injury">{t('causeTypes.injury')}</SelectItem>
                  <SelectItem value="environmental">{t('causeTypes.environmental')}</SelectItem>
                  <SelectItem value="unknown">{t('causeTypes.unknown')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Row 3: Cause Description */}
      <FormField
        control={form.control}
        name="causeDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1">
              {t('form.causeDescription')} <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder={t('form.enterCauseDescription')}
                className="resize-none"
                rows={3}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
