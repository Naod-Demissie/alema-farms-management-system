"use client";

import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";

// Production Schemas
export const eggProductionSchema = z.object({
  flockId: z.string().min(1, "Please select a flock"),
  date: z.date(),
  normalCount: z.number().min(0, "Normal count must be 0 or greater"),
  crackedCount: z.number().min(0, "Cracked count must be 0 or greater"),
  spoiledCount: z.number().min(0, "Spoiled count must be 0 or greater"),
  notes: z.string().optional()
});

export const broilerProductionSchema = z.object({
  flockId: z.string().min(1, "Please select a flock"),
  date: z.date(),
  quantity: z.number().min(0, "Quantity must be 0 or greater"),
  notes: z.string().optional()
});

export const manureProductionSchema = z.object({
  flockId: z.string().min(1, "Please select a flock"),
  date: z.date(),
  quantity: z.number().min(0, "Quantity must be 0 or greater"),
  notes: z.string().optional()
});

// Constants
export const BROILER_UNITS = [
  { value: 'birds', label: 'Birds' },
  { value: 'kg', label: 'Kilograms' },
  { value: 'lbs', label: 'Pounds' }
] as const;

// Flock interface
interface Flock {
  id: string;
  batchCode: string;
  currentCount: number;
}

// Form Components
interface ProductionFormProps {
  form: UseFormReturn<any>;
  flocks: Flock[];
  flocksLoading?: boolean;
  productionType: 'eggs' | 'broiler' | 'manure';
}

export function ProductionForm({ form, flocks, flocksLoading = false, productionType }: ProductionFormProps) {
  const t = useTranslations('production.form');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    form.getValues("date") || new Date()
  );

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      form.setValue("date", date);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="flockId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flock')} <span className="text-red-500">{t('required')}</span></FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('flockPlaceholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {flocksLoading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                        {t('loadingFlocks')}
                      </div>
                    </SelectItem>
                  ) : flocks.length === 0 ? (
                    <SelectItem value="no-flocks" disabled>
                      <div className="text-muted-foreground">{t('noFlocks')}</div>
                    </SelectItem>
                  ) : (
                    flocks.map((flock) => (
                      <SelectItem key={flock.id} value={flock.id}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{flock.batchCode}</span>
                          <span className="text-muted-foreground ml-2">
                            {flock.currentCount.toLocaleString()} {t('birds')}
                          </span>
                        </div>
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
            <FormItem>
              <FormLabel>{t('date')} <span className="text-red-500">{t('required')}</span></FormLabel>
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
                        <span>{t('datePlaceholder')}</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
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
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Quantity for non-egg production */}
      {productionType !== 'eggs' && (
        <div className="grid gap-4 md:grid-cols-1">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('quantity')} <span className="text-red-500">{t('required')}</span></FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder={t('quantityPlaceholder')}
                    value={field.value === 0 ? "" : field.value}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? 0 : parseFloat(value) || 0);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {/* Egg production fields */}
      {productionType === 'eggs' && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="normalCount"
              render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      {t('normalCount')} <span className="text-red-500">{t('required')}</span>
                    </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder={t('quantityPlaceholder')}
                      value={field.value === 0 ? "" : field.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? 0 : parseInt(value) || 0);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="crackedCount"
              render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      {t('crackedCount')} <span className="text-red-500">{t('required')}</span>
                    </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder={t('quantityPlaceholder')}
                      value={field.value === 0 ? "" : field.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? 0 : parseInt(value) || 0);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="spoiledCount"
              render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      {t('spoiledCount')} <span className="text-red-500">{t('required')}</span>
                    </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder={t('quantityPlaceholder')}
                      value={field.value === 0 ? "" : field.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? 0 : parseInt(value) || 0);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="bg-muted/50 p-3 rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-1">{t('totalEggs')}</div>
            <div className="text-xl font-semibold">
              {(form.watch("normalCount") || 0) + (form.watch("crackedCount") || 0) + (form.watch("spoiledCount") || 0)}
            </div>
          </div>
        </>
      )}

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('notes')}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={t('notesPlaceholder')}
                className="resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
