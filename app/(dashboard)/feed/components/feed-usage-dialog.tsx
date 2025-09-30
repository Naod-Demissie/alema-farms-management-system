"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
  feedId: z.string().min(1, "Feed is required"),
  date: z.date(),
  amountUsed: z.number().min(0.1, "Amount must be greater than 0"),
  unit: z.enum(["KG", "QUINTAL"]),
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

  const form = useForm<FeedUsageFormData>({
    resolver: zodResolver(feedUsageSchema),
    defaultValues: initialData || {
      flockId: "",
      feedId: "",
      date: new Date(),
      amountUsed: 0,
      unit: "KG",
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
    } else {
      form.reset({
        flockId: "",
        feedId: "",
        date: new Date(),
        amountUsed: 0,
        unit: "KG",
        notes: "",
      });
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
      
      // Auto-select matching feed
      const matchingFeed = feedInventory.find(feed => 
        feed.feedType === flockRecommendation.recommendation.feedType && feed.isActive
      );
      
      if (matchingFeed) {
        form.setValue('feedId', matchingFeed.id);
        form.setValue('amountUsed', flockRecommendation.recommendation.totalAmountKg);
      }
    } else {
      setRecommendation(null);
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="flockId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Flock</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        handleFlockChange(value);
                      }} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9">
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
              </div>
            </div>

            {/* Feed Program Recommendation */}
            {recommendation && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 text-sm">Feed Program Recommendation</h4>
                  <Badge className={`${feedTypeColors[recommendation.feedType as keyof typeof feedTypeColors]} text-xs`}>
                    {feedTypeLabels[recommendation.feedType as keyof typeof feedTypeColors]}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-2">
                  <div>
                    <span className="text-blue-700 dark:text-blue-300 font-medium">Age:</span>
                    <div className="text-blue-900 dark:text-blue-100">{recommendation.ageInWeeks} weeks ({recommendation.ageInDays} days)</div>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300 font-medium">Per hen:</span>
                    <div className="text-blue-900 dark:text-blue-100">{recommendation.gramPerHen}g</div>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300 font-medium">Total:</span>
                    <div className="text-blue-900 dark:text-blue-100 font-semibold">{recommendation.totalAmountKg.toFixed(1)}kg</div>
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

            {/* Feed Selection */}
            <FormField
              control={form.control}
              name="feedId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Feed</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select feed" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {feedInventory
                        .filter(feed => feed.isActive)
                        .map((feed) => (
                          <SelectItem key={feed.id} value={feed.id}>
                            <div className="flex items-center justify-between w-full">
                              <span className="truncate">{feed.name}</span>
                              <Badge className={`ml-2 ${feedTypeColors[feed.feedType as keyof typeof feedTypeColors]}`}>
                                {feedTypeLabels[feed.feedType as keyof typeof feedTypeColors]}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Usage Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium">Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date"
                        className="h-9"
                        {...field}
                        value={field.value ? field.value.toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : new Date())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amountUsed"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium">Amount Used</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        placeholder="0.0"
                        className="h-9"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium">Unit</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="kg" 
                        className="h-9"
                        {...field} 
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
                      className="min-h-[60px] resize-none"
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
