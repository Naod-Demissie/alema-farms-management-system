"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { feedTypeLabels, feedTypeColors } from "@/lib/feed-program";
import { 
  createFeedUsageAction, 
  updateFeedUsageAction 
} from "@/app/actions/feed-usage";
import { getFeedInventoryAction } from "@/app/actions/feed-inventory";
import { getFlocksAction } from "@/app/actions/flocks";
import { getFeedRecommendationsAction } from "@/app/actions/feed-program";

const feedUsageSchema = z.object({
  flockId: z.string().min(1, "Flock is required"),
  date: z.date(),
  amountUsed: z.number().min(0.1, "Amount must be greater than 0"),
  notes: z.string().optional(),
});

type FeedUsageFormData = z.infer<typeof feedUsageSchema>;

interface FeedUsageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FeedUsageFormData) => Promise<void>;
  initialData?: FeedUsageFormData;
  title?: string;
  description?: string;
  submitButtonText?: string;
}

export function FeedUsageDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title = "Record Feed Usage",
  description = "Record a new feed usage for a flock.",
  submitButtonText = "Record Usage"
}: FeedUsageDialogProps) {
  const [flocks, setFlocks] = useState<any[]>([]);
  const [feedInventory, setFeedInventory] = useState<any[]>([]);
  const [feedRecommendations, setFeedRecommendations] = useState<any[]>([]);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialData?.date ? new Date(initialData.date) : new Date()
  );

  const form = useForm<FeedUsageFormData>({
    resolver: zodResolver(feedUsageSchema),
    defaultValues: initialData || {
      flockId: "",
      date: new Date(),
      amountUsed: 0,
      notes: "",
    },
  });

  // Fetch data when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
      setSelectedDate(new Date(initialData.date));
    } else {
      form.reset({
        flockId: "",
        date: new Date(),
        amountUsed: 0,
        notes: "",
      });
      setSelectedDate(new Date());
    }
  }, [initialData, form]);

  const fetchData = async () => {
    try {
      const [flocksResult, feedInventoryResult, feedRecommendationsResult] = await Promise.all([
        getFlocksAction(),
        getFeedInventoryAction(),
        getFeedRecommendationsAction()
      ]);

      if (flocksResult.success) {
        setFlocks(flocksResult.data || []);
      }
      if (feedInventoryResult.success) {
        setFeedInventory(feedInventoryResult.data || []);
      }
      if (feedRecommendationsResult.success) {
        setFeedRecommendations(feedRecommendationsResult.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    }
  };

  const handleFlockChange = (flockId: string) => {
    const flockRecommendation = feedRecommendations.find(rec => rec.flock.id === flockId);
    
    if (flockRecommendation) {
      setRecommendation(flockRecommendation.recommendation);
      
      // Auto-set the recommended amount
      form.setValue('amountUsed', flockRecommendation.recommendation.totalAmountKg);
    } else {
      setRecommendation(null);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      form.setValue('date', date);
    }
  };

  const handleSubmit = async (data: FeedUsageFormData) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error("Error submitting feed usage:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-semibold">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Flock Selection */}
            <FormField
                  control={form.control}
                  name="flockId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Flock<span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        handleFlockChange(value);
                      }} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue placeholder="Select flock" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {flocks.map((flock) => {
                            const flockRec = feedRecommendations.find(rec => rec.flock.id === flock.id);
                            return (
                              <SelectItem key={flock.id} value={flock.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span className="truncate">{flock.batchCode} ({flock.breed} - {flock.currentCount} birds)</span>
                                  {flockRec && (
                                    <Badge className={`ml-2 ${feedTypeColors[flockRec.recommendation.feedType as keyof typeof feedTypeColors]}`}>
                                      {feedTypeLabels[flockRec.recommendation.feedType as keyof typeof feedTypeLabels]}
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
            />

            {/* Feed Program Recommendation */}
            {recommendation && (
              <div className="p-3 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">Feed Program Recommendation</h4>
                  <Badge className={`${feedTypeColors[recommendation.feedType as keyof typeof feedTypeColors]} text-xs`}>
                    {feedTypeLabels[recommendation.feedType as keyof typeof feedTypeColors]}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-2">
                  <div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Age:</span>
                    <div className="text-gray-900 dark:text-gray-100">{recommendation.ageInWeeks} weeks ({recommendation.ageInDays} days)</div>
                  </div>
                  <div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Per hen:</span>
                    <div className="text-gray-900 dark:text-gray-100">{recommendation.gramPerHen}g</div>
                  </div>
                  <div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Total:</span>
                    <div className="text-gray-900 dark:text-gray-100 font-semibold">{recommendation.totalAmountKg.toFixed(1)}kg</div>
                  </div>
                </div>
                {recommendation.isTransitionWeek && (
                  <div className="mb-2 p-2 bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded text-orange-800 dark:text-orange-200 text-xs">
                    ⚠️ Feed change next week to {feedTypeLabels[recommendation.nextFeedType as keyof typeof feedTypeLabels]}
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs"
                  onClick={() => {
                    form.setValue('amountUsed', recommendation.totalAmountKg);
                  }}
                >
                  Use Recommendation
                </Button>
              </div>
            )}

            {/* Usage Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium">Date<span className="text-red-500">*</span></FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal h-9",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "MMM dd, yyyy")
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
              <FormField
                control={form.control}
                name="amountUsed"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium">Amount Used (kg)<span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        placeholder="0.0"
                        className="h-9 w-full"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about this feeding..."
                      className="min-h-[60px] resize-none w-full"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-3 border-t">
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="px-4 h-9 w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="px-4 h-9 w-full sm:w-auto"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {submitButtonText}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
