"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { useTranslations } from 'next-intl';
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
import { Switch } from "@/components/ui/switch";
import { 
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Loader2, XCircle, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";

// Schemas
export const flockSchema = z.object({
  batchCode: z.string().min(1, "Flock ID is required"),
  arrivalDate: z.date(),
  initialCount: z.number().min(1, "Initial count must be at least 1"),
  currentCount: z.number().min(0, "Current count cannot be negative"),
  ageInDays: z.number().min(0, "Age at arrival is required"),
  notes: z.string().optional(),
}).refine((data) => data.currentCount <= data.initialCount, {
  message: "Current count cannot exceed initial count",
  path: ["currentCount"],
});

export const vaccinationSchema = z.object({
  vaccineName: z.string().min(1, "Vaccine name is required"),
  flockId: z.string().min(1, "Flock ID is required"),
  administeredDate: z.date({
    message: "Administered date is required",
  }).optional(),
  scheduledDate: z.date().optional(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  dosage: z.string().min(1, "Dosage is required"),
  dosageUnit: z.string().optional(),
  notes: z.string().optional(),
  administrationMethod: z.enum(["INJECTION", "DRINKING_WATER", "SPRAY", "OTHER"]).optional(),
  isScheduled: z.boolean().default(false),
  reminderEnabled: z.boolean().default(false),
  reminderDaysBefore: z.number().optional(),
  sendEmail: z.boolean().default(false),
  sendInAppAlert: z.boolean().default(false),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.number().optional(),
  recurringEndDate: z.date().optional(),
}).refine((data) => {
  // Either administeredDate or scheduledDate must be provided
  if (!data.administeredDate && !data.scheduledDate) {
    return false;
  }
  // If scheduled, scheduledDate is required
  if (data.isScheduled && !data.scheduledDate) {
    return false;
  }
  // If not scheduled, administeredDate is required
  if (!data.isScheduled && !data.administeredDate) {
    return false;
  }
  // If reminder is enabled, reminderDaysBefore is required
  if (data.reminderEnabled && !data.reminderDaysBefore) {
    return false;
  }
  // If reminder is enabled, at least one notification channel must be selected
  if (data.reminderEnabled && !data.sendEmail && !data.sendInAppAlert) {
    return false;
  }
  // If recurring, interval is required
  if (data.isRecurring && !data.recurringInterval) {
    return false;
  }
  return true;
}, {
  message: "Invalid vaccination data",
});

export const treatmentSchema = z.object({
  flockId: z.string().min(1, "Flock ID is required"),
  disease: z.enum(["respiratory", "digestive", "parasitic", "nutritional", "other"], {
    message: "Disease type is required",
  }),
  diseaseName: z.string().min(1, "Disease name is required"),
  diseasedBirdsCount: z.number().min(1, "Number of diseased birds must be at least 1"),
  medication: z.string().min(1, "Medication is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  duration: z.string().min(1, "Duration is required"),
  treatedBy: z.string().min(1, "Treated by is required"),
  startDate: z.date({
    message: "Start date is required",
  }),
  endDate: z.date().optional(),
  notes: z.string().optional(),
  symptoms: z.string().optional(),
});

export const treatmentStatusUpdateSchema = z.object({
  deceasedCount: z.number().min(0, "Deceased count cannot be negative"),
  recoveredCount: z.number().min(0, "Recovered count cannot be negative"),
  stillSickCount: z.number().min(0, "Still sick count cannot be negative"),
  statusUpdateNotes: z.string().optional(),
}).refine((data) => {
  const total = data.deceasedCount + data.recoveredCount + data.stillSickCount;
  return total >= 0;
}, {
  message: "Total counts must be valid",
  path: ["deceasedCount"],
});

// Options
export const BREED_OPTIONS = [
  { value: 'broiler', label: 'Broiler', description: 'Fast-growing meat birds' },
  { value: 'layer', label: 'Layer', description: 'Egg-laying hens' },
  { value: 'dual_purpose', label: 'Dual Purpose', description: 'Both meat and eggs' },
];

export const SOURCE_OPTIONS = [
  { value: 'hatchery', label: 'Hatchery', description: 'Commercial hatchery' },
  { value: 'farm', label: 'Farm', description: 'Local farm' },
  { value: 'imported', label: 'Imported', description: 'Imported birds' },
];

export const DISEASE_OPTIONS = [
  { value: 'respiratory', label: 'Respiratory' },
  { value: 'digestive', label: 'Digestive' },
  { value: 'parasitic', label: 'Parasitic' },
  { value: 'nutritional', label: 'Nutritional' },
  { value: 'other', label: 'Other' },
];

// Form Components
interface FlockFormProps {
  form: UseFormReturn<z.infer<typeof flockSchema>>;
  flocks?: any[];
  onGenerateBatchCode?: (breed: string) => Promise<string | null>;
  t?: any;
}

export function FlockForm({ form, flocks = [], onGenerateBatchCode, t }: FlockFormProps) {
  // Provide default translations if t is not provided (for backwards compatibility)
  const getLabel = (key: string, defaultValue: string) => t ? t(key) : defaultValue;
  
  return (
    <>
      {/* Row 1: Flock ID Generation */}
      <div className="flex gap-4">
        <FormField
          control={form.control}
          name="batchCode"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="flex items-center gap-1">
                {getLabel('form.flockIdLabel', 'Flock ID')} <span className="text-red-500">*</span>
              </FormLabel>
              <div className="flex flex-col sm:flex-row gap-2">
                <FormControl>
                  <Input placeholder={getLabel('form.flockIdPlaceholder', 'e.g., FL2501')} {...field} className="h-10" />
                </FormControl>
                {onGenerateBatchCode && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      const batchCode = await onGenerateBatchCode('');
                      if (batchCode) {
                        form.setValue('batchCode', batchCode);
                      }
                    }}
                    className="whitespace-nowrap h-10 px-4"
                  >
                    {getLabel('form.generateButton', 'Generate')}
                  </Button>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Row 2: Arrival Date and Age in Days */}
      <div className="flex flex-col sm:flex-row gap-4">
        <FormField
          control={form.control}
          name="arrivalDate"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="flex items-center gap-1">
                {getLabel('form.arrivalDateLabel', 'Arrival Date')} <span className="text-red-500">*</span>
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal h-10",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        EthiopianDateFormatter.formatForTable(field.value)
                      ) : (
                        <span>{getLabel('form.arrivalDatePlaceholder', 'Pick a date')}</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ageInDays"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="flex items-center gap-1">
                {getLabel('form.ageInDaysLabel', 'Age at Arrival (Days)')} <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  placeholder={getLabel('form.ageInDaysPlaceholder', 'e.g., 1, 7, 14')}
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

      {/* Row 3: Initial Count and Current Count */}
      <div className="flex flex-col sm:flex-row gap-4">
        <FormField
          control={form.control}
          name="initialCount"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="flex items-center gap-1">
                {getLabel('form.initialCountLabel', 'Initial Count')} <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder={getLabel('form.initialCountPlaceholder', 'e.g., 1000')}
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
          name="currentCount"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="flex items-center gap-1">
                {getLabel('form.currentCountLabel', 'Current Count')} <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  placeholder={getLabel('form.currentCountPlaceholder', 'e.g., 950')}
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

      {/* Row 4: Notes */}
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{getLabel('form.notesLabel', 'Notes')}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={getLabel('form.notesPlaceholder', 'Additional notes about the flock...')}
                className="min-h-[80px]"
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

interface VaccinationFormProps {
  form: UseFormReturn<z.infer<typeof vaccinationSchema>>;
  flocks: any[];
  veterinarians: any[];
  flocksLoading?: boolean;
  veterinariansLoading?: boolean;
}

export function VaccinationForm({ form, flocks, veterinarians, flocksLoading = false, veterinariansLoading = false }: VaccinationFormProps) {
  const t = useTranslations('health.vaccination');
  const isScheduled = form.watch("isScheduled");
  const reminderEnabled = form.watch("reminderEnabled");
  const isRecurring = form.watch("isRecurring");

  return (
    <>
      {/* 1st Row: Flock ID and Scheduled Date */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="flockId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('flock')} <span className="text-red-500">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('flock')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {flocksLoading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('loadingData')}
                      </div>
                    </SelectItem>
                  ) : flocks.length === 0 ? (
                    <SelectItem value="no-flocks" disabled>
                      <div className="text-muted-foreground">{t('noRecords')}</div>
                    </SelectItem>
                  ) : (
                    flocks.map((flock: any) => (
                      <SelectItem key={flock.id} value={flock.id}>
                        {flock.batchCode}
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
          name="scheduledDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('scheduledDate')} <span className="text-red-500">*</span>
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal h-10",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        EthiopianDateFormatter.formatForTable(field.value)
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Vaccination Type Toggle */}
      <FormField
        control={form.control}
        name="isScheduled"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <FormLabel>{t('isScheduled', 'Scheduled Vaccination')}</FormLabel>
              <div className="text-sm text-muted-foreground">
                {t('isScheduledDescription', 'Toggle between scheduled and administered vaccination')}
              </div>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Administered Date - Only show when not scheduled */}
      {!isScheduled && (
        <FormField
          control={form.control}
          name="administeredDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('administeredDate')} <span className="text-red-500">*</span>
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal h-10",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        EthiopianDateFormatter.formatForTable(field.value)
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date()}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* 2nd Row: Vaccine Name and Administration Method */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="vaccineName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('vaccineName')} <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder={t('vaccineNamePlaceholder', 'e.g., Newcastle Disease Vaccine')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="administrationMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('administrationMethod')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('administrationMethod')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="INJECTION">{t('administrationMethods.INJECTION')}</SelectItem>
                  <SelectItem value="DRINKING_WATER">{t('administrationMethods.DRINKING_WATER')}</SelectItem>
                  <SelectItem value="SPRAY">{t('administrationMethods.SPRAY')}</SelectItem>
                  <SelectItem value="OTHER">{t('administrationMethods.OTHER')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* 3rd Row: Quantity, Dosage, and Dosage Unit */}
      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('quantity')} <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="500"
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
          name="dosage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('dosage')} <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  step="0.1"
                  placeholder="0.5"
                  value={field.value === "" ? "" : field.value}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dosageUnit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('dosageUnit', 'Unit')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('selectUnit', 'Select unit')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ml">{t('units.ml', 'ml')}</SelectItem>
                  <SelectItem value="mg">{t('units.mg', 'mg')}</SelectItem>
                  <SelectItem value="g">{t('units.g', 'g')}</SelectItem>
                  <SelectItem value="drops">{t('units.drops', 'drops')}</SelectItem>
                  <SelectItem value="tablets">{t('units.tablets', 'tablets')}</SelectItem>
                  <SelectItem value="capsules">{t('units.capsules', 'capsules')}</SelectItem>
                  <SelectItem value="units">{t('units.units', 'units')}</SelectItem>
                  <SelectItem value="cc">{t('units.cc', 'cc')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Total Calculator */}
      <div className="bg-muted/50 p-3 rounded-lg text-center">
        <div className="text-sm text-muted-foreground mb-1">{t('totalDosage', 'Total Dosage')}</div>
        <div className="text-xl font-semibold">
          {(() => {
            const quantity = form.watch("quantity") || 0;
            const dosage = parseFloat(form.watch("dosage")) || 0;
            const unit = form.watch("dosageUnit") || "";
            const total = quantity * dosage;
            return total > 0 ? `${total.toFixed(1)} ${unit}` : "0";
          })()}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {t('totalCalculation', 'Quantity × Dosage per bird')}
        </div>
      </div>


      {/* Reminder Settings - Only show for scheduled vaccinations */}
      {isScheduled && (
        <>
          <div className="border-t pt-4 mt-2">
            <h4 className="text-sm font-medium mb-3">{t('reminderSettings')}</h4>
            <FormField
              control={form.control}
              name="reminderEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t('enableReminder')}</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      {t('reminderDescription')}
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {reminderEnabled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reminderDaysBefore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('remindMeDaysBefore')} <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t('remindMeDaysBefore')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 {t('daysLabel', 'day before')}</SelectItem>
                          <SelectItem value="3">3 {t('daysLabel', 'days before')}</SelectItem>
                          <SelectItem value="7">7 {t('daysLabel', 'days before')}</SelectItem>
                          <SelectItem value="14">14 {t('daysLabel', 'days before')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-3">
                  <FormLabel>{t('notificationChannels')} <span className="text-red-500">*</span></FormLabel>
                  <FormField
                    control={form.control}
                    name="sendEmail"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <FormLabel className="font-normal">{t('sendEmail')}</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sendInAppAlert"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <FormLabel className="font-normal">{t('inAppAlert')}</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {!form.watch("sendEmail") && !form.watch("sendInAppAlert") && (
                <p className="text-sm text-red-500">At least one notification channel must be selected</p>
              )}
            </>
          )}

          {/* Recurring Settings */}
          <div className="border-t pt-4 mt-2">
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t('recurringVaccination')}</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      {t('recurringDescription')}
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {isRecurring && (
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="recurringInterval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('repeatEvery')} <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 30"
                        min="1"
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? undefined : parseInt(value) || undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recurringEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('endDate')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal h-10",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              EthiopianDateFormatter.formatForTable(field.value)
                            ) : (
                              <span>{t('noEndDate')}</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </>
      )}

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('notes', 'Notes')}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={t('notesPlaceholder', 'Additional notes about the vaccination...')}
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

interface TreatmentFormProps {
  form: UseFormReturn<z.infer<typeof treatmentSchema>>;
  flocks: any[];
  veterinarians: any[];
  flocksLoading?: boolean;
  veterinariansLoading?: boolean;
  t?: any;
}

export function TreatmentForm({ form, flocks, veterinarians, flocksLoading = false, veterinariansLoading = false, t }: TreatmentFormProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="flockId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t ? t('columns.flockId') : 'Flock ID'} <span className="text-red-500">*</span></FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select flock" />
                  </SelectTrigger>
                </FormControl>
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
                      <div className="text-muted-foreground">No flocks available</div>
                    </SelectItem>
                  ) : (
                    flocks.map((flock) => (
                      <SelectItem key={flock.id} value={flock.id}>
                        {flock.batchCode}
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
          name="disease"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t ? t('diseaseType') : 'Disease Type'} <span className="text-red-500">*</span></FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select disease type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DISEASE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="diseaseName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t ? t('diseaseName') : 'Disease Name'} <span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <Input placeholder="e.g., Infectious Bronchitis" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="diseasedBirdsCount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t ? t('diseasedBirdsCount') : 'Number of Diseased Birds'} <span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="e.g., 25" 
                min="1"
                value={field.value || ''}
                onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="medication"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Medication <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input placeholder="e.g., Amoxicillin" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dosage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dosage <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input placeholder="e.g., 10mg/kg body weight" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frequency <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input placeholder="e.g., Twice daily" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input placeholder="e.g., 5 days" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="treatedBy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Treated By <span className="text-red-500">*</span></FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select veterinarian" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {veterinariansLoading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading veterinarians...
                      </div>
                    </SelectItem>
                  ) : veterinarians.length === 0 ? (
                    <SelectItem value="no-vets" disabled>
                      <div className="text-muted-foreground">No veterinarians available</div>
                    </SelectItem>
                  ) : (
                    veterinarians.map((vet) => (
                      <SelectItem key={vet.id} value={vet.id}>
                        {vet.name}
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
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date <span className="text-red-500">*</span></FormLabel>
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
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date("1900-01-01")
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

      <FormField
        control={form.control}
        name="endDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>End Date</FormLabel>
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
                      format(field.value, "MMM dd, yyyy")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) =>
                    date < new Date("1900-01-01")
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="symptoms"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Symptoms</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe the symptoms observed..."
                className="resize-none"
                rows={3}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Additional notes about the treatment..."
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

interface TreatmentStatusUpdateFormProps {
  form: UseFormReturn<z.infer<typeof treatmentStatusUpdateSchema>>;
  treatment: any;
  t?: any;
}

export function TreatmentStatusUpdateForm({ form, treatment, t }: TreatmentStatusUpdateFormProps) {
  const getLabel = (key: string, fallback: string) => {
    return t ? t(key) : fallback;
  };

  const initialDiseasedCount = treatment?.diseasedBirdsCount || 0;
  const currentDeceased = form.watch("deceasedCount") || 0;
  const currentRecovered = form.watch("recoveredCount") || 0;
  const currentStillSick = form.watch("stillSickCount") || 0;
  const totalAccounted = currentDeceased + currentRecovered + currentStillSick;

  return (
    <div className="space-y-6">
      {/* Treatment Information */}
      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
        <h4 className="font-medium text-sm">{getLabel('statusUpdate.treatmentInfo', 'Treatment Information')}</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">{getLabel('columns.flockId', 'Flock')}:</span>
            <span className="ml-2 font-medium">{treatment?.flock?.batchCode || treatment?.flockId}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{getLabel('columns.diseaseName', 'Disease')}:</span>
            <span className="ml-2 font-medium">{treatment?.diseaseName}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{getLabel('statusUpdate.initialDiseasedCount', 'Initial Diseased Count')}:</span>
            <span className="ml-2 font-medium">{initialDiseasedCount}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{getLabel('columns.medication', 'Medication')}:</span>
            <span className="ml-2 font-medium">{treatment?.medication}</span>
          </div>
        </div>
      </div>

      {/* Status Update Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="deceasedCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                {getLabel('columns.deceasedCount', 'Deceased Count')} <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
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
          name="recoveredCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                {getLabel('columns.recoveredCount', 'Recovered Count')} <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
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
          name="stillSickCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                {getLabel('columns.stillSickCount', 'Still Sick Count')} <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
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

      {/* Validation Summary */}
      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
        <h4 className="font-medium text-sm mb-2">{getLabel('statusUpdate.validationSummary', 'Validation Summary')}</h4>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>{getLabel('statusUpdate.initialDiseasedCount', 'Initial Diseased Count')}:</span>
            <span className="font-medium">{initialDiseasedCount}</span>
          </div>
          <div className="flex justify-between">
            <span>{getLabel('statusUpdate.totalAccounted', 'Total Accounted For')}:</span>
            <span className="font-medium">{totalAccounted}</span>
          </div>
          <div className="flex justify-between">
            <span>{getLabel('statusUpdate.difference', 'Difference')}:</span>
            <span className={`font-medium ${totalAccounted === initialDiseasedCount ? 'text-green-600' : 'text-orange-600'}`}>
              {initialDiseasedCount - totalAccounted}
            </span>
          </div>
        </div>
        {totalAccounted !== initialDiseasedCount && (
          <p className="text-xs text-orange-600 mt-2">
            {getLabel('statusUpdate.countMismatch', 'Note: The total accounted birds does not match the initial diseased count. This may be due to birds that were not part of the original count or data entry errors.')}
          </p>
        )}
      </div>

      {/* Notes */}
      <FormField
        control={form.control}
        name="statusUpdateNotes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{getLabel('statusUpdate.notes', 'Status Update Notes')}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={getLabel('statusUpdate.notesPlaceholder', 'Add any additional notes about the status update...')}
                className="min-h-[80px]"
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
