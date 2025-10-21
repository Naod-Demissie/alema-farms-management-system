"use client";

import { useState } from "react";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createWeightSampling } from "../../server/weight-sampling";
import { toast } from "sonner";
import { CalendarIcon, Scale, Users, FileText, Plus, Trash2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";
import { cn } from "@/lib/utils";

interface WeightSamplingFormProps {
  flockId: string;
  flockBatchCode: string;
  onSuccess: () => void;
}

interface SampleWeight {
  id: string;
  weight: string;
}

export function WeightSamplingForm({ flockId, flockBatchCode, onSuccess }: WeightSamplingFormProps) {
  const t = useTranslations('feed.weightSampling');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date(),
    sampleSize: 50,
    samplingMethod: 'random' as 'random' | 'systematic' | 'stratified',
    notes: ''
  });
  const [sampleWeights, setSampleWeights] = useState<SampleWeight[]>([
    { id: '1', weight: '' }
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculate total weight from all sample weights
      const totalWeight = sampleWeights.reduce((sum, sample) => {
        return sum + (parseFloat(sample.weight) || 0);
      }, 0);

      if (totalWeight <= 0) {
        toast.error("Please enter at least one valid weight");
        setLoading(false);
        return;
      }

      const result = await createWeightSampling({
        flockId,
        date: formData.date,
        sampleSize: formData.sampleSize,
        totalWeight: totalWeight,
        samplingMethod: formData.samplingMethod,
        notes: formData.notes || undefined
      });

      if (result.success) {
        toast.success("Weight sampling recorded successfully");
        onSuccess();
        // Reset form
        setFormData({
          date: new Date(),
          sampleSize: 50,
          samplingMethod: 'random',
          notes: ''
        });
        setSampleWeights([{ id: '1', weight: '' }]);
      } else {
        toast.error(result.error || "Failed to record weight sampling");
      }
    } catch (error) {
      toast.error("An error occurred while recording weight sampling");
    } finally {
      setLoading(false);
    }
  };

  // Calculate total weight and average weight
  const totalWeight = sampleWeights.reduce((sum, sample) => {
    return sum + (parseFloat(sample.weight) || 0);
  }, 0);
  
  const averageWeight = totalWeight > 0 && formData.sampleSize 
    ? (totalWeight / formData.sampleSize).toFixed(2)
    : '0.00';

  // Helper functions for managing sample weights
  const addSampleWeight = () => {
    const newId = (sampleWeights.length + 1).toString();
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Record Weight Sampling
        </CardTitle>
        <CardDescription>
          Flock: {flockBatchCode}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
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
                    {formData.date ? EthiopianDateFormatter.formatForTable(formData.date) : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => date && setFormData({...formData, date})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sampleSize" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Sample Size (birds)
              </Label>
              <Input
                id="sampleSize"
                type="number"
                min="10"
                max="200"
                value={formData.sampleSize}
                onChange={(e) => setFormData({...formData, sampleSize: parseInt(e.target.value) || 0})}
                required
                placeholder="Number of birds sampled"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Sample Weights (kg)
              </Label>
              <div className="space-y-2">
                {sampleWeights.map((sample, index) => (
                  <div key={sample.id} className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={sample.weight}
                      onChange={(e) => updateSampleWeight(sample.id, e.target.value)}
                      placeholder={`Sample ${index + 1} weight`}
                      className="flex-1"
                    />
                    {sampleWeights.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSampleWeight(sample.id)}
                        className="px-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSampleWeight}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sample Weight
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="samplingMethod">Sampling Method</Label>
              <Select
                value={formData.samplingMethod}
                onValueChange={(value: 'random' | 'systematic' | 'stratified') => 
                  setFormData({...formData, samplingMethod: value})
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">Random Sampling</SelectItem>
                  <SelectItem value="systematic">Systematic Sampling</SelectItem>
                  <SelectItem value="stratified">Stratified Sampling</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {totalWeight > 0 && formData.sampleSize && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Weight:</span>
                  <span className="text-lg font-bold text-primary">{totalWeight.toFixed(2)} kg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Weight:</span>
                  <span className="text-lg font-bold text-primary">{averageWeight} kg</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Based on {sampleWeights.length} sample{sampleWeights.length !== 1 ? 's' : ''} and {formData.sampleSize} birds
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Any additional observations, environmental conditions, or notes..."
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Recording..." : "Record Weight Sampling"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

