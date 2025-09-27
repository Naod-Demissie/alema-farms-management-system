"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Egg, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ProductionFormData, EGG_GRADES, BROILER_UNITS } from "./production-types";
import { 
  createEggProduction, 
  createBroilerProduction, 
  createManureProduction,
  updateEggProduction,
  updateBroilerProduction,
  updateManureProduction
} from "@/server/production";
import { toast } from "sonner";

const eggProductionSchema = z.object({
  flockId: z.string().min(1, "Please select a flock"),
  date: z.string().min(1, "Please select a date"),
  normalCount: z.number().min(0, "Normal count must be 0 or greater"),
  crackedCount: z.number().min(0, "Cracked count must be 0 or greater"),
  spoiledCount: z.number().min(0, "Spoiled count must be 0 or greater"),
  notes: z.string().optional()
});

const broilerProductionSchema = z.object({
  flockId: z.string().min(1, "Please select a flock"),
  date: z.string().min(1, "Please select a date"),
  quantity: z.number().min(0, "Quantity must be 0 or greater"),
  notes: z.string().optional()
});

const manureProductionSchema = z.object({
  flockId: z.string().min(1, "Please select a flock"),
  date: z.string().min(1, "Please select a date"),
  quantity: z.number().min(0, "Quantity must be 0 or greater"),
  notes: z.string().optional()
});

interface Flock {
  id: string;
  batchCode: string;
  breed: string;
  currentCount: number;
}

interface ProductionFormProps {
  flocks: Flock[];
  flocksLoading?: boolean;
  productionType: 'eggs' | 'broiler' | 'manure';
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<ProductionFormData> & { id?: string };
}

export function ProductionForm({
  flocks,
  flocksLoading = false,
  productionType,
  onSuccess,
  onCancel,
  initialData
}: ProductionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialData?.date ? new Date(initialData.date) : new Date()
  );

  // Get the appropriate schema based on production type
  const getSchema = () => {
    switch (productionType) {
      case 'eggs':
        return eggProductionSchema;
      case 'broiler':
        return broilerProductionSchema;
      case 'manure':
        return manureProductionSchema;
      default:
        return eggProductionSchema;
    }
  };

  const form = useForm<z.infer<typeof eggProductionSchema> | z.infer<typeof broilerProductionSchema> | z.infer<typeof manureProductionSchema>>({
    resolver: zodResolver(getSchema()),
    defaultValues: {
      flockId: initialData?.flockId || "",
      date: initialData?.date || format(new Date(), "yyyy-MM-dd"),
      ...(productionType === 'eggs' ? {
        normalCount: (initialData as any)?.gradeCounts?.normal || 0,
        crackedCount: (initialData as any)?.gradeCounts?.cracked || 0,
        spoiledCount: (initialData as any)?.gradeCounts?.spoiled || 0
      } : {
        quantity: (initialData as any)?.quantity || 0
      }),
      notes: initialData?.notes || ""
    }
  });

  const selectedFlock = flocks.find(flock => flock.id === form.watch("flockId"));

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    
    try {
      const baseData = {
        flockId: data.flockId,
        date: new Date(data.date),
        quantity: data.quantity,
        notes: data.notes
      };

      const isUpdate = initialData?.id;
      let result;
      
      switch (productionType) {
        case 'eggs':
          const totalCount = data.normalCount + data.crackedCount + data.spoiledCount;
          const gradeCounts = {
            normal: data.normalCount,
            cracked: data.crackedCount,
            spoiled: data.spoiledCount
          };
          
          if (isUpdate) {
            result = await updateEggProduction(initialData.id!, {
              totalCount,
              gradeCounts,
              notes: data.notes
            });
          } else {
            result = await createEggProduction({
              ...baseData,
              totalCount,
              gradeCounts
            });
          }
          break;
        case 'broiler':
          if (isUpdate) {
            result = await updateBroilerProduction(initialData.id!, {
              quantity: data.quantity,
              notes: data.notes
            });
          } else {
            result = await createBroilerProduction({
              ...baseData,
              quantity: data.quantity
            });
          }
          break;
        case 'manure':
          if (isUpdate) {
            result = await updateManureProduction(initialData.id!, {
              quantity: data.quantity,
              notes: data.notes
            });
          } else {
            result = await createManureProduction({
              ...baseData,
              quantity: data.quantity
            });
          }
          break;
        default:
          throw new Error("Invalid production type");
      }

      if (result.success) {
        toast.success(`${isUpdate ? 'Updated' : 'Created'} ${productionType.charAt(0).toUpperCase() + productionType.slice(1)} production record successfully`);
        onSuccess();
      } else {
        toast.error(result.message || `Failed to ${isUpdate ? 'update' : 'create'} production record`);
      }
    } catch (error) {
      console.error("Error creating production record:", error);
      toast.error("An error occurred while creating the production record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      form.setValue("date", format(date, "yyyy-MM-dd"));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="flockId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Flock <span className="text-red-500">*</span></FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a flock" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {flocksLoading ? (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
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
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{flock.batchCode}</span>
                            <span className="text-muted-foreground ml-2">
                              {flock.currentCount.toLocaleString()} birds
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
                <FormLabel>Date <span className="text-red-500">*</span></FormLabel>
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
                          format(new Date(field.value), "MMM dd, yyyy")
                        ) : (
                          <span>Select date</span>
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
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                      Normal <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
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
                name="crackedCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      Cracked <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
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
                name="spoiledCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      Spoiled <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-muted/50 p-3 rounded-lg text-center">
              <div className="text-sm text-muted-foreground mb-1">Total Eggs</div>
              <div className="text-xl font-semibold">
                {(form.watch("normalCount") || 0) + (form.watch("crackedCount") || 0) + (form.watch("spoiledCount") || 0)}
              </div>
            </div>
          </>
        )}

        {/* Broiler Production Fields - Simplified */}
        {productionType === 'broiler' && (
          <div className="text-center py-4 text-muted-foreground">
            {/* Broiler production form fields will be handled by the main form */}
          </div>
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes about this production record..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />



        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {initialData?.id ? "Updating..." : "Creating..."}
              </div>
            ) : (
              initialData?.id ? "Update" : "Add"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
