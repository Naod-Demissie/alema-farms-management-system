"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getWeightSamplingWithFCR, deleteWeightSampling } from "../../server/weight-sampling";
import { WeightSamplingDialog } from "./weight-sampling-dialog";
import { WeightSamplingViewDialog } from "./weight-sampling-view-dialog";
import { toast } from "sonner";
import { Scale, Trash2, Edit, Calendar, Users, Weight, Eye } from "lucide-react";
import { format } from "date-fns";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTranslations } from "next-intl";

interface WeightSamplingTableProps {
  flockId?: string;
  dateRange?: { start: Date; end: Date };
  onRefresh: () => void;
}

interface WeightSamplingRecord {
  id: string;
  date: Date;
  sampleSize: number;
  totalWeight: number;
  averageWeight: number;
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
}

export function WeightSamplingTable({ flockId, dateRange, onRefresh }: WeightSamplingTableProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WeightSamplingRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<WeightSamplingRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<WeightSamplingRecord | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const fetchData = async () => {
    setDataLoading(true);
    try {
      const result = await getWeightSamplingWithFCR(flockId, dateRange);
      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (error) {
      toast.error("Failed to fetch weight sampling data");
    } finally {
      setDataLoading(false);
    }
  };

  // Fetch data on component mount and when props change
  React.useEffect(() => {
    fetchData();
  }, [flockId, dateRange]);

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const result = await deleteWeightSampling(id);
      if (result.success) {
        toast.success("Weight sampling record deleted successfully");
        onRefresh();
        fetchData(); // Refresh the table
      } else {
        toast.error(result.error || "Failed to delete weight sampling record");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the record");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: WeightSamplingRecord) => {
    setEditingRecord(record);
    setIsEditDialogOpen(true);
  };

  const handleView = (record: WeightSamplingRecord) => {
    setViewingRecord(record);
    setIsViewDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setEditingRecord(null);
    onRefresh();
    fetchData();
  };

  const handleViewClose = () => {
    setIsViewDialogOpen(false);
    setViewingRecord(null);
  };


  if (dataLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Weight Sampling Records
          </CardTitle>
          <CardDescription>
            Historical weight sampling data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading weight sampling data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          {t("title")}
        </CardTitle>
        <CardDescription>
          {data.length} {data.length !== 1 ? t("recordsFound") : t("recordFound")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8">
            <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("noRecordsTitle")}</h3>
            <p className="text-muted-foreground">
              {t("noRecordsDescription")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t("date")}
                  </TableHead>
                  <TableHead className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {t("sampleSize")}
                  </TableHead>
                  <TableHead className="flex items-center gap-2">
                    <Weight className="h-4 w-4" />
                    {t("totalWeight")}
                  </TableHead>
                  <TableHead>{t("avgWeight")}</TableHead>
                  <TableHead>{t("fcrLifetime")}</TableHead>
                  <TableHead>{t("fcrPrevious")}</TableHead>
                  <TableHead>{t("flock")}</TableHead>
                  <TableHead>{t("recordedBy")}</TableHead>
                  <TableHead>{tCommon("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {EthiopianDateFormatter.formatForTable(new Date(record.date))}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{record.sampleSize}</span>
                        <span className="text-xs text-muted-foreground">birds</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{record.totalWeight.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">kg</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{record.averageWeight.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground">kg</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.isFirstRecording ? (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-medium">{record.fcrLifetime.toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground">
                            {record.weightGainLifetime.toFixed(1)}kg gain
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.isFirstRecording ? (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-medium">{record.fcrPrevious.toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground">
                            {record.weightGainPrevious.toFixed(1)}kg gain
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{record.flock.batchCode}</span>
                        <span className="text-xs text-muted-foreground">
                          {record.flock.currentCount} {t("birds")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.recordedBy?.name || tCommon("unknown")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleView(record)}
                          title={tCommon("viewDetails")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(record)}
                          title={tCommon("editRecord")}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={loading} title={tCommon("deleteRecord")}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("deleteConfirmDesc")}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(record.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {tCommon("delete")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Edit Dialog */}
    {editingRecord && (
      <WeightSamplingDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={handleEditSuccess}
        editingRecord={{
          id: editingRecord.id,
          flockId: editingRecord.flockId,
          date: editingRecord.date.toISOString(),
          sampleSize: editingRecord.sampleSize,
          sampleWeights: editingRecord.sampleWeights,
          totalWeight: editingRecord.totalWeight,
          averageWeight: editingRecord.averageWeight,
          notes: editingRecord.notes,
          flock: editingRecord.flock
        }}
      />
    )}

    {/* View Detail Dialog */}
    {viewingRecord && (
      <WeightSamplingViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        record={viewingRecord}
      />
    )}
  </>
  );
}
