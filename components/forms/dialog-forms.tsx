"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
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
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";

// Schemas
export const flockSchema = z.object({
  batchCode: z.string().min(1, "Batch code is required"),
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
  }),
  administeredBy: z.string().min(1, "Administered by is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  dosage: z.string().min(1, "Dosage is required"),
  notes: z.string().optional(),
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
      {/* Row 1: Batch Code Generation */}
      <div className="flex gap-4">
        <FormField
          control={form.control}
          name="batchCode"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="flex items-center gap-1">
                {getLabel('form.batchCodeLabel', 'Batch Code')} <span className="text-red-500">*</span>
              </FormLabel>
              <div className="flex flex-col sm:flex-row gap-2">
                <FormControl>
                  <Input placeholder={getLabel('form.batchCodePlaceholder', 'e.g., FL2501')} {...field} className="h-10" />
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
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="vaccineName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Vaccine Name <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g., Newcastle Disease Vaccine" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="flockId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Flock ID <span className="text-red-500">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="administeredDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Administered Date <span className="text-red-500">*</span>
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
          name="administeredBy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Administered By <span className="text-red-500">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    veterinarians.map((vet: any) => (
                      <SelectItem key={vet.id} value={vet.name}>
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Quantity <span className="text-red-500">*</span>
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
                Dosage <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g., 0.5ml per bird" {...field} />
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
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Additional notes about the vaccination..."
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
