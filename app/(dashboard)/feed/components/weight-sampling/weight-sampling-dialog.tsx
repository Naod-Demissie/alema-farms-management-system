"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createWeightSampling, updateWeightSampling } from "../../server/weight-sampling";
import { getFlocksAction } from "../../../flocks/server/flocks";
import { toast } from "sonner";
import { CalendarIcon, Scale, Bird, FileText, Plus, X, Calculator } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";

interface WeightSamplingDialogProps {
  onSuccess: () => void;
  editingRecord?: {
    id: string;
    flockId: string;
    date: string;
    sampleSize: number;
    sampleWeights: number[];
    totalWeight: number;
    averageWeight: number;
    notes?: string;
    flock?: {
      batchCode: string;
      currentCount: number;
    };
  } | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface SampleWeightCard {
  id: string;
  weight: string;
}

interface Flock {
  id: string;
  batchCode: string;
  currentCount: number;
}

export function WeightSamplingDialog({ onSuccess, editingRecord, open: externalOpen, onOpenChange: externalOnOpenChange }: WeightSamplingDialogProps) {
  const t = useTranslations("feed.analytics.weightSampling.dialog");
  const tCommon = useTranslations("common");
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use external open state if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [selectedFlockId, setSelectedFlockId] = useState<string>("");
  const [formData, setFormData] = useState({
    date: new Date(),
    notes: ''
  });
  const [sampleWeights, setSampleWeights] = useState<SampleWeightCard[]>([
    { id: `sample-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, weight: '' }
  ]);

  // Initialize form with editing data
  useEffect(() => {
    if (editingRecord) {
      setFormData({
        date: new Date(editingRecord.date),
        notes: editingRecord.notes || ''
      });
      setSampleWeights(
        editingRecord.sampleWeights.map((weight, index) => ({
          id: `sample-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
          weight: weight.toString()
        }))
      );
    } else {
      // Reset form for new record
      setSelectedFlockId("");
      setFormData({
        date: new Date(),
        notes: ''
      });
      setSampleWeights([{ id: `sample-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, weight: '' }]);
    }
  }, [editingRecord, open]);

  // Set flock ID when flocks are loaded and we have an editing record
  useEffect(() => {
    if (editingRecord && flocks.length > 0) {
      // Verify the flock exists in the list before setting it
      const flockExists = flocks.find(flock => flock.id === editingRecord.flockId);
      if (flockExists) {
        setSelectedFlockId(editingRecord.flockId);
      } else {
        console.warn('Flock not found in flocks list:', editingRecord.flockId);
        // Set it anyway in case the flock exists but wasn't loaded yet
        setSelectedFlockId(editingRecord.flockId);
      }
    }
  }, [editingRecord, flocks]);

  // Fetch flocks on component mount
  useEffect(() => {
    const fetchFlocks = async () => {
      try {
        const result = await getFlocksAction();
        if (result.success && result.data) {
          setFlocks(result.data);
        }
      } catch (error) {
        console.error("Error fetching flocks:", error);
      }
    };
    fetchFlocks();
  }, []);

  // Calculate total weight and average weight
  const totalWeight = sampleWeights.reduce((sum, sample) => {
    return sum + (parseFloat(sample.weight) || 0);
  }, 0);
  
  const averageWeight = totalWeight > 0 && sampleWeights.length > 0
    ? (totalWeight / sampleWeights.length).toFixed(2)
    : '0.00';

  // Helper functions for managing sample weights
  const addSampleWeight = () => {
    // Generate a unique ID using timestamp and random number to avoid duplicates
    const newId = `sample-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setSampleWeights([...sampleWeights, { id: newId, weight: '' }]);
  };

  const removeSampleWeight = (id: string) => {
    if (sampleWeights.length > 1) {
      setSampleWeights(sampleWeights.filter(sample => sample.id !== id));
    }
  };

  const updateSampleWeight = (id: string, weight: string) => {
    setSampleWeights(sampleWeights.map(sample => 
      sample.id === id ? { ...sample, weight } : sample
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedFlockId) {
        toast.error(t("selectFlockError"));
        setLoading(false);
        return;
      }

      // Calculate total weight from all sample weights
      const totalWeight = sampleWeights.reduce((sum, sample) => {
        return sum + (parseFloat(sample.weight) || 0);
      }, 0);

      if (totalWeight <= 0) {
        toast.error(t("enterValidWeightError"));
        setLoading(false);
        return;
      }

      const sampleWeightsArray = sampleWeights.map(sample => parseFloat(sample.weight) || 0);

      const result = editingRecord 
        ? await updateWeightSampling(editingRecord.id, {
            date: formData.date,
            sampleSize: sampleWeights.length,
            sampleWeights: sampleWeightsArray,
            totalWeight: totalWeight,
            notes: formData.notes || undefined
          })
        : await createWeightSampling({
            flockId: selectedFlockId,
            date: formData.date,
            sampleSize: sampleWeights.length,
            sampleWeights: sampleWeightsArray,
            totalWeight: totalWeight,
            notes: formData.notes || undefined
          });

      if (result.success) {
        toast.success(editingRecord ? t("updateSuccess") : t("recordSuccess"));
        // Reset form
        setFormData({
          date: new Date(),
          notes: ''
        });
        setSampleWeights([{ id: `sample-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, weight: '' }]);
        setSelectedFlockId("");
        setOpen(false);
        onSuccess();
      } else {
        toast.error(result.error || (editingRecord ? t("updateError") : t("recordError")));
      }
    } catch (error) {
      toast.error(editingRecord ? t("updateError") : t("recordError"));
    } finally {
      setLoading(false);
    }
  };

  const selectedFlock = flocks.find(f => f.id === selectedFlockId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!editingRecord && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t("addButton")}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            {editingRecord ? t("editTitle") : t("addTitle")}
          </DialogTitle>
          <DialogDescription>
            {editingRecord ? t("editDescription") : t("addDescription")}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Flock Selection and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flock">{t("selectFlock")} <span className="text-red-500">*</span></Label>
              <Select value={selectedFlockId} onValueChange={setSelectedFlockId} key={selectedFlockId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("chooseFlock")} />
                </SelectTrigger>
                <SelectContent>
                  {flocks.map((flock) => (
                    <SelectItem key={flock.id} value={flock.id}>
                      {flock.batchCode} ({flock.currentCount} {t("birds")})
                    </SelectItem>
                  ))}
                  {/* Show current flock even if not in the list (for editing) */}
                  {editingRecord && !flocks.find(f => f.id === editingRecord.flockId) && editingRecord.flock && (
                    <SelectItem value={editingRecord.flockId} disabled>
                      {editingRecord.flock.batchCode} ({editingRecord.flock.currentCount} {t("birds")}) - {t("current")}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">{tCommon("date")} <span className="text-red-500">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? EthiopianDateFormatter.formatForTable(formData.date) : <span>{t("pickDate")}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    selected={formData.date}
                    onSelect={(date) => date && setFormData({...formData, date})}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Sample Weights Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">{t("sampleWeights")} ({tCommon("kg")}) <span className="text-red-500">*</span></Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSampleWeight}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t("addSample")}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sampleWeights.map((sample, index) => (
                <Card key={sample.id} className="relative p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">{t("sample")} {index + 1}</span>
                    {sampleWeights.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSampleWeight(sample.id)}
                        className="h-4 w-4 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`weight-${sample.id}`} className="text-xs font-medium">{t("sampleWeight")} ({tCommon("kg")})</Label>
                    <Input
                      id={`weight-${sample.id}`}
                      type="number"
                      step="0.1"
                      min="0"
                      value={sample.weight}
                      onChange={(e) => updateSampleWeight(sample.id, e.target.value)}
                      placeholder="0.0"
                      className="text-center text-sm font-semibold h-7"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Weight Calculation Summary */}
          {totalWeight > 0 && (
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Sample Count */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                      <Bird className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{t("samples")}</p>
                      <p className="text-lg font-bold text-green-700 dark:text-green-300">
                        {sampleWeights.length}
                      </p>
                    </div>
                  </div>
                  
                  {/* Total Weight */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                      <Scale className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{t("totalWeight")}</p>
                      <p className="text-lg font-bold text-green-700 dark:text-green-300">
                        {totalWeight.toFixed(2)} {tCommon("kg")}
                      </p>
                    </div>
                  </div>
                  
                  {/* Average Weight */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                      <Calculator className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{t("avgWeight")}</p>
                      <p className="text-lg font-bold text-green-700 dark:text-green-300">
                        {averageWeight} {tCommon("kg")}
                      </p>
                    </div>
                  </div>
                </div>
                {selectedFlock && (
                  <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                    <div className="text-sm text-green-600 dark:text-green-400">
                      <strong>{t("flock")}:</strong> {selectedFlock.batchCode} ({selectedFlock.currentCount} {t("birds")})
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t("notes")} ({t("optional")})
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder={t("notesPlaceholder")}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={loading || !selectedFlockId}>
              {loading ? (editingRecord ? t("updating") : t("recording")) : (editingRecord ? t("updateButton") : t("recordButton"))}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
