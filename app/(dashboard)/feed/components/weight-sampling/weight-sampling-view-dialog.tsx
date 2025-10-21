"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scale, Calendar, Users, Weight, Calculator, FileText, Bird } from "lucide-react";
import { format } from "date-fns";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";

interface WeightSamplingViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: {
    id: string;
    date: Date;
    sampleSize: number;
    totalWeight: number;
    averageWeight: number;
    sampleWeights: number[];
    notes?: string;
    flock: {
      batchCode: string;
      currentCount: number;
    };
    recordedBy?: {
      name: string;
    };
    fcrLifetime: number;
    fcrPrevious: number;
    weightGainLifetime: number;
    weightGainPrevious: number;
    isFirstRecording: boolean;
  };
}

export function WeightSamplingViewDialog({ open, onOpenChange, record }: WeightSamplingViewDialogProps) {
  const t = useTranslations("feed.analytics.weightSampling.viewDialog");
  const tCommon = useTranslations("common");
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] max-h-[60vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{t("basicInformation")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="text-sm text-muted-foreground">{tCommon("date")}: </span>
                    <span className="font-medium">
                      {EthiopianDateFormatter.formatForTable(record.date)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="text-sm text-muted-foreground">{t("flock")}: </span>
                    <span className="font-medium">{record.flock.batchCode} ({record.flock.currentCount} {t("birds")})</span>
                  </div>
                </div>

                {record.recordedBy && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <span className="text-sm text-muted-foreground">{t("recordedBy")}: </span>
                      <span className="font-medium">{record.recordedBy.name}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Weight Statistics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{t("weightStatistics")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-0.5">
                    <Bird className="h-4 w-4 text-orange-600" />
                  </div>
                  <p className="text-base font-bold text-orange-700">{record.sampleSize}</p>
                  <p className="text-xs text-muted-foreground">{t("samples")}</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-0.5">
                    <Weight className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-base font-bold text-green-700">{record.totalWeight.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">{t("totalKg")}</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-0.5">
                    <Calculator className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-base font-bold text-blue-700">{record.averageWeight.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{t("avgKg")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sample Weights */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{t("sampleWeights")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-1.5">
                {record.sampleWeights.map((weight, index) => (
                  <div key={index} className="p-1.5 border rounded text-center">
                    <p className="text-xs text-muted-foreground mb-0.5">#{index + 1}</p>
                    <p className="font-semibold text-xs">{weight.toFixed(1)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* FCR Information */}
          {!record.isFirstRecording && (
            <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{t("feedConversionRatio")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 border rounded">
                  <div className="mb-0.5">
                    <span className="text-xs font-medium">{t("lifetime")}</span>
                  </div>
                  <p className="text-base font-bold">{record.fcrLifetime.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    +{record.weightGainLifetime.toFixed(1)}{tCommon("kg")}
                  </p>
                </div>

                <div className="p-2 border rounded">
                  <div className="mb-0.5">
                    <span className="text-xs font-medium">{t("previous")}</span>
                  </div>
                  <p className="text-base font-bold">{record.fcrPrevious.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    +{record.weightGainPrevious.toFixed(1)}{tCommon("kg")}
                  </p>
                </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {record.notes && (
            <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {tCommon("notes")}
              </CardTitle>
            </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{record.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-1">
            <Button onClick={() => onOpenChange(false)} size="sm">
              {tCommon("close")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
