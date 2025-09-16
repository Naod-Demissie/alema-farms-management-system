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
import { ProductionFormData, EGG_GRADES, FERTILITY_OPTIONS } from "./production-types";
import { createEggProduction } from "@/server/production";
import { toast } from "sonner";

const productionSchema = z.object({
  flockId: z.string().min(1, "Please select a flock"),
  date: z.string().min(1, "Please select a date"),
  quantity: z.number().min(0, "Quantity must be 0 or greater"),
  grade: z.enum(['A', 'B', 'C', 'cracked', 'discard'], {
    required_error: "Please select a grade"
  }),
  fertility: z.enum(['fertile', 'infertile']).optional(),
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
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<ProductionFormData>;
}

export function ProductionForm({
  flocks,
  onSuccess,
  onCancel,
  initialData
}: ProductionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialData?.date ? new Date(initialData.date) : new Date()
  );

  const form = useForm<z.infer<typeof productionSchema>>({
    resolver: zodResolver(productionSchema),
    defaultValues: {
      flockId: initialData?.flockId || "",
      date: initialData?.date || format(new Date(), "yyyy-MM-dd"),
      quantity: initialData?.quantity || 0,
      grade: initialData?.grade || undefined,
      fertility: initialData?.fertility || undefined,
      notes: initialData?.notes || ""
    }
  });

  const selectedFlock = flocks.find(flock => flock.id === form.watch("flockId"));

  const onSubmit = async (data: z.infer<typeof productionSchema>) => {
    setIsSubmitting(true);
    
    try {
      const result = await createEggProduction({
        flockId: data.flockId,
        date: new Date(data.date),
        quantity: data.quantity,
        grade: data.grade,
        fertility: data.fertility,
        notes: data.notes
      });

      if (result.success) {
        toast.success("Egg production record created successfully");
        onSuccess();
      } else {
        toast.error(result.message || "Failed to create production record");
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Flock Selection */}
          <FormField
            control={form.control}
            name="flockId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Flock *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a flock" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {flocks.map((flock) => (
                      <SelectItem key={flock.id} value={flock.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{flock.batchCode}</span>
                          <span className="text-sm text-muted-foreground">
                            {flock.breed} • {flock.currentCount} birds
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

          {/* Date Selection */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Collection Date *</FormLabel>
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
                          format(new Date(field.value), "PPP")
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

        {/* Production Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Egg className="h-4 w-4" />
              Production Details
            </CardTitle>
            <CardDescription>
              Record the quantity and quality of eggs collected
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Quantity */}
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of eggs collected
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Grade */}
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EGG_GRADES.map((grade) => (
                          <SelectItem key={grade.value} value={grade.value}>
                            <div className="flex items-center gap-2">
                              <div className={cn("w-3 h-3 rounded-full", grade.color)} />
                              {grade.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fertility */}
            <FormField
              control={form.control}
              name="fertility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fertility (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fertility status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FERTILITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={cn("w-3 h-3 rounded-full", option.color)} />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Optional: Mark eggs as fertile or infertile
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about the production..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Any additional information about the egg collection
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Flock Information */}
        {selectedFlock && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Selected Flock Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Batch Code:</span>
                  <span className="font-medium">{selectedFlock.batchCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Breed:</span>
                  <span className="font-medium capitalize">{selectedFlock.breed.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Count:</span>
                  <span className="font-medium">{selectedFlock.currentCount.toLocaleString()} birds</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grade Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Grade Classification Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm">
              {EGG_GRADES.map((grade) => (
                <div key={grade.value} className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", grade.color)} />
                  <span className="font-medium">{grade.label}:</span>
                  <span className="text-muted-foreground">
                    {grade.value === 'A' && 'Perfect shape, clean shell, no cracks'}
                    {grade.value === 'B' && 'Minor imperfections, slightly dirty shell'}
                    {grade.value === 'C' && 'Visible defects, dirty shell, irregular shape'}
                    {grade.value === 'cracked' && 'Visible cracks in shell'}
                    {grade.value === 'discard' && 'Broken, contaminated, or unfit for consumption'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
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
            {isSubmitting ? "Creating..." : "Create Production Record"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
