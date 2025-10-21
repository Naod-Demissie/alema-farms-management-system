"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getWeightSamplingWithFCR, deleteWeightSampling } from "../../server/weight-sampling";
import { toast } from "sonner";
import { Scale } from "lucide-react";
import { format } from "date-fns";
import { WeightFCRTable } from "./weight-fcr-table";
import { WeightFCRRecord } from "./weight-fcr-columns";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MonthPicker } from "@/components/ui/monthpicker";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";
import { EthiopianCalendarUtils, ETHIOPIAN_MONTHS } from "@/lib/ethiopian-calendar";
import { DataTableFacetedFilter } from "@/components/table/data-table-faceted-filter";
import { WeightSamplingDialog } from "../weight-sampling/weight-sampling-dialog";
import { WeightSamplingViewDialog } from "../weight-sampling/weight-sampling-view-dialog";
import { useTranslations } from "next-intl";

interface CombinedTableProps {
  onRefresh: () => void;
}

export function CombinedWeightFCRTable({ onRefresh }: CombinedTableProps) {
  const t = useTranslations("feed.analytics.weightSampling");
  const tCommon = useTranslations("common");
  const [data, setData] = useState<WeightFCRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [flocks, setFlocks] = useState<Array<{ id: string; batchCode: string; currentCount: number }>>([]);
  const [editingRecord, setEditingRecord] = useState<WeightFCRRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<WeightFCRRecord | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    record: WeightFCRRecord | null;
  }>({
    open: false,
    record: null,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedFlockId, setSelectedFlockId] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getWeightSamplingWithFCR();
      if (result.success && result.data) {
            const mapped: WeightFCRRecord[] = result.data.map((r: any) => ({
              id: r.id,
              flockId: r.flockId,
              date: new Date(r.date).toISOString(),
              dateDisplay: EthiopianDateFormatter.formatForTable(new Date(r.date)),
              sampleSize: r.sampleSize,
              sampleWeights: r.sampleWeights || [],
              totalWeight: r.totalWeight,
              averageWeight: r.averageWeight,
              fcrLifetime: r.isFirstRecording ? undefined : r.fcrLifetime,
              fcrPrevious: r.isFirstRecording ? undefined : r.fcrPrevious,
              weightGainLifetime: r.isFirstRecording ? undefined : r.weightGainLifetime,
              weightGainPrevious: r.isFirstRecording ? undefined : r.weightGainPrevious,
              isFirstRecording: r.isFirstRecording,
              flockBatchCode: r.flock.batchCode,
              flockCurrentCount: r.flock.currentCount,
              recordedByName: r.recordedBy?.name,
              notes: r.notes,
            }));
        setData(mapped);
      }
    } catch (error) {
      console.error("Error fetching weight sampling data:", error);
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleView = (record: WeightFCRRecord) => {
    setViewingRecord(record);
    setViewDialogOpen(true);
  };

  const handleEdit = (record: WeightFCRRecord) => {
    console.log('Editing record:', record);
    console.log('Record flockId:', record.flockId);
    setEditingRecord(record);
    setDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setEditingRecord(null);
    setDialogOpen(false);
    fetchData();
    onRefresh();
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingRecord(null);
    }
  };

  const handleViewDialogClose = (open: boolean) => {
    setViewDialogOpen(open);
    if (!open) {
      setViewingRecord(null);
    }
  };

  const handleDelete = (record: WeightFCRRecord) => {
    setConfirmDialog({
      open: true,
      record: record,
    });
  };

  const confirmDelete = async () => {
    if (!confirmDialog.record) return;

    setActionLoading("delete");
    try {
      const result = await deleteWeightSampling(confirmDialog.record.id);
      if (result.success) {
        toast.success(t("deleteSuccess"));
        await fetchData();
        onRefresh();
      } else {
        toast.error(result.error || t("deleteError"));
      }
    } catch (error) {
      console.error("Error deleting weight sampling:", error);
      toast.error(t("deleteError"));
    } finally {
      setActionLoading(null);
      setConfirmDialog({ open: false, record: null });
    }
  };

  // Load flocks for filter
  useEffect(() => {
    (async () => {
      try {
        const { getFlocksAction } = await import("@/app/(dashboard)/flocks/server/flocks");
        const res = await getFlocksAction();
        if (res.success && res.data) {
          setFlocks(res.data.map((f: any) => ({ id: f.id, batchCode: f.batchCode, currentCount: f.currentCount })));
        }
      } catch (e) {
        console.error("Failed to load flocks for filter", e);
      }
    })();
  }, []);

  // Toolbar with Month and Date pickers similar to other tables
  const Toolbar = ({ table }: { table: any }) => (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
        {/* Flock Filter (exact same component used in production toolbar) */}
        {table?.getColumn && table.getColumn("flockId") && (
          <DataTableFacetedFilter
            column={table.getColumn("flockId")}
            title={t("flockFilter")}
            options={flocks.map((flock) => ({
              label: `${flock.batchCode} (${flock.currentCount} ${t("birds")})`,
              value: flock.id,
            }))}
          />
        )}
        {/* Month Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-8 w-full sm:w-[180px] pl-3 text-left font-normal",
                !selectedMonth && "text-muted-foreground"
              )}
              disabled={!!selectedDate}
            >
              {selectedMonth ? (
                (() => {
                  const ethDate = EthiopianCalendarUtils.gregorianToEthiopian(selectedMonth);
                  return `${ETHIOPIAN_MONTHS[ethDate.month - 1]} ${ethDate.year} ዓ.ም`;
                })()
              ) : (
                <span>{t("filterByMonth")}</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <MonthPicker
              selectedMonth={selectedMonth}
              onMonthSelect={(date) => {
                setSelectedMonth(date);
                if (date) setSelectedDate(undefined);
              }}
            />
          </PopoverContent>
        </Popover>

        {/* Specific Date Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-8 w-full sm:w-[180px] pl-3 text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
              disabled={!!selectedMonth}
            >
              {selectedDate ? (
                EthiopianDateFormatter.formatForTable(selectedDate)
              ) : (
                <span>{t("filterByDate")}</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                if (date) setSelectedMonth(undefined);
              }}
              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
            />
          </PopoverContent>
        </Popover>

        {(table?.getState?.().columnFilters?.length > 0 || selectedMonth || selectedDate) && (
          <Button
            variant="ghost"
            onClick={() => {
              table?.resetColumnFilters?.();
              setSelectedMonth(undefined);
              setSelectedDate(undefined);
            }}
            className="h-8 px-2 lg:px-3"
          >
            {tCommon("reset")}
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );

  // Apply client-side filtering by selectedMonth/selectedDate
  const filteredData = useMemo(() => {
    let out = data;
    if (selectedFlockId) {
      out = out.filter((r) => r.flockId === selectedFlockId);
    }
    if (!selectedMonth && !selectedDate) return out;
    return out.filter((r) => {
      const d = new Date(r.date);
      if (selectedDate) {
        return d.toDateString() === selectedDate.toDateString();
      }
      if (selectedMonth) {
        return d.getFullYear() === selectedMonth.getFullYear() && d.getMonth() === selectedMonth.getMonth();
      }
      return true;
    });
  }, [data, selectedMonth, selectedDate, selectedFlockId]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                {t("title")}
              </CardTitle>
              <CardDescription>
                {filteredData.length} {filteredData.length !== 1 ? t("recordsFound") : t("recordFound")}
              </CardDescription>
            </div>
            <WeightSamplingDialog 
              onSuccess={handleEditSuccess} 
              editingRecord={editingRecord}
              open={dialogOpen}
              onOpenChange={handleDialogClose}
            />
          </div>
        </CardHeader>
        <CardContent>
          <WeightFCRTable
            data={filteredData}
            loading={loading}
            toolbarRender={(table) => <Toolbar table={table} />}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {/* View Dialog */}
      {viewingRecord && (
        <WeightSamplingViewDialog
          open={viewDialogOpen}
          onOpenChange={handleViewDialogClose}
          record={{
            id: viewingRecord.id,
            date: new Date(viewingRecord.date),
            sampleSize: viewingRecord.sampleSize,
            totalWeight: viewingRecord.totalWeight,
            averageWeight: viewingRecord.averageWeight,
            sampleWeights: viewingRecord.sampleWeights,
            notes: viewingRecord.notes,
            flock: {
              batchCode: viewingRecord.flockBatchCode,
              currentCount: viewingRecord.flockCurrentCount,
            },
            recordedBy: viewingRecord.recordedByName ? {
              name: viewingRecord.recordedByName,
            } : undefined,
            fcrLifetime: viewingRecord.fcrLifetime || 0,
            fcrPrevious: viewingRecord.fcrPrevious || 0,
            weightGainLifetime: viewingRecord.weightGainLifetime || 0,
            weightGainPrevious: viewingRecord.weightGainPrevious || 0,
            isFirstRecording: viewingRecord.isFirstRecording,
          }}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ open, record: null })}
        title={t("deleteConfirmTitle")}
        desc={
          confirmDialog.record
            ? t("deleteConfirmDesc", { flockCode: confirmDialog.record.flockBatchCode })
            : tCommon("confirmProceed")
        }
        confirmText={tCommon("delete")}
        cancelBtnText={tCommon("cancel")}
        destructive={true}
        handleConfirm={confirmDelete}
        isLoading={actionLoading === "delete"}
      />
    </>
  );
}
