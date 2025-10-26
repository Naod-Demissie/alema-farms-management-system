"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Plus, 
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  CalendarDays,
  FileText,
  AlertTriangle,
  Activity,
  Loader2
} from "lucide-react";
import { MortalityTable } from "./mortality-table";
import { mortalityColumns } from "./mortality-columns";
import { MortalityDialog } from "../dialogs/mortality-dialog";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";
import { 
  getMortalityRecords, 
  createMortalityRecord, 
  updateMortalityRecord, 
  deleteMortalityRecord
} from "@/app/(dashboard)/health/server/health";
import { getFlocks } from "@/app/(dashboard)/flocks/server/flocks";

// Validation schema
const mortalitySchema = z.object({
  flockId: z.string().min(1, "Flock ID is required"),
  date: z.date({
    message: "Date is required",
  }),
  count: z.number().min(1, "Count must be at least 1"),
  cause: z.enum(["disease", "injury", "environmental", "unknown"]),
  causeDescription: z.string().min(1, "Cause description is required"),
  recordedBy: z.string().min(1, "Recorded by is required"),
});

export function MortalityManagement() {
  const t = useTranslations('health.mortality');
  const [mortalityRecords, setMortalityRecords] = useState<any[]>([]);
  const [flocks, setFlocks] = useState<Array<{ id: string; batchCode: string; currentCount: number }>>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | null;
    record: any | null;
  }>({
    open: false,
    type: null,
    record: null,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form setup
  const form = useForm<z.infer<typeof mortalitySchema>>({
    resolver: zodResolver(mortalitySchema),
    defaultValues: {
      flockId: "",
      date: new Date(),
      count: 0,
      cause: "disease",
      causeDescription: "",
      recordedBy: "",
    },
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchMortalityRecords();
    fetchFlocks();
  }, []);

  const fetchFlocks = async () => {
    try {
      const result = await getFlocks({}, { page: 1, limit: 100 });
      if (result.success && result.data) {
        setFlocks(result.data.map(flock => ({
          id: flock.id,
          batchCode: flock.batchCode,
          currentCount: flock.currentCount
        })));
      } else {
        console.error("Failed to fetch flocks:", result.message);
        setFlocks([]);
      }
    } catch (error) {
      console.error("Error fetching flocks:", error);
      setFlocks([]);
    }
  };

  const fetchMortalityRecords = async () => {
    try {
      setLoading(true);
      const result = await getMortalityRecords(1, 100);
      if (result && result.success) {
        setMortalityRecords(result.data.records || []);
      } else {
        console.error("Failed to fetch mortality records:", result?.message || "Unknown error");
        setMortalityRecords([]);
      }
    } catch (error) {
      console.error("Error fetching mortality records:", error);
      setMortalityRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingRecord(null);
    form.reset({
      flockId: "",
      date: new Date(),
      count: 0,
      cause: "disease",
      causeDescription: "",
      recordedBy: "",
    });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    form.reset({
      flockId: record.flockId,
      date: new Date(record.date),
      count: record.count,
      cause: record.cause,
      causeDescription: record.causeDescription,
      recordedBy: record.recordedById || record.recordedBy,
    });
    setIsAddDialogOpen(true);
  };

  const handleDeleteClick = (record: any) => {
    setConfirmDialog({
      open: true,
      type: 'delete',
      record: record,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.type) return;

    if (confirmDialog.type === 'delete' && confirmDialog.record) {
      await executeDeleteRecord(confirmDialog.record);
    }

    setConfirmDialog({
      open: false,
      type: null,
      record: null,
    });
  };

  const executeDeleteRecord = async (record: any) => {
    setActionLoading(record.id);
    try {
      const result = await deleteMortalityRecord(record.id);
      
      if (result.success) {
        toast.success(t('deleteSuccess'), {
          description: t('deleteSuccessDesc'),
        });
        await fetchMortalityRecords();
      } else {
        toast.error(t('deleteError'), {
          description: result.message || result.error || t('unexpectedError'),
        });
      }
    } catch (error) {
      console.error("Error deleting mortality record:", error);
      toast.error(t('deleteError'), {
        description: error instanceof Error ? error.message : t('unexpectedError'),
      });
    } finally {
      setActionLoading(null);
    }
  };


  const handleSubmit = async (data: z.infer<typeof mortalitySchema>) => {
    setLoading(true);
    try {
      const result = await createMortalityRecord({
        ...data,
        date: data.date.toISOString(),
      });
      
      if (result.success) {
        toast.success(t('createSuccess'), {
          description: t('createSuccessDesc', { count: data.count }),
        });
        setIsAddDialogOpen(false);
        form.reset();
        await fetchMortalityRecords();
      } else {
        toast.error(t('createError'), {
          description: result.message || result.error || t('unexpectedError'),
        });
      }
    } catch (error) {
      console.error("Error creating mortality record:", error);
      toast.error(t('createError'), {
        description: error instanceof Error ? error.message : t('unexpectedError'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: z.infer<typeof mortalitySchema>) => {
    if (!editingRecord) return;
    
    setLoading(true);
    try {
      const result = await updateMortalityRecord(editingRecord.id, {
        ...data,
        date: data.date.toISOString(),
      });
      
      if (result.success) {
        toast.success(t('updateSuccess'), {
          description: t('updateSuccessDesc'),
        });
        setIsAddDialogOpen(false);
        setEditingRecord(null);
        form.reset();
        await fetchMortalityRecords();
      } else {
        toast.error(t('updateError'), {
          description: result.message || result.error || t('unexpectedError'),
        });
      }
    } catch (error) {
      console.error("Error updating mortality record:", error);
      toast.error(t('updateError'), {
        description: error instanceof Error ? error.message : t('unexpectedError'),
      });
    } finally {
      setLoading(false);
    }
  };

  const getCauseBadge = (cause: string) => {
    switch (cause) {
      case "disease":
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />{t('causeTypes.disease')}</Badge>;
      case "injury":
        return <Badge variant="outline" className="border-orange-200 text-orange-800"><Activity className="w-3 h-3 mr-1" />{t('causeTypes.injury')}</Badge>;
      case "environmental":
        return <Badge variant="outline" className="border-blue-200 text-blue-800"><AlertCircle className="w-3 h-3 mr-1" />{t('causeTypes.environmental')}</Badge>;
      case "unknown":
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />{t('causeTypes.unknown')}</Badge>;
      default:
        return <Badge variant="secondary">{cause}</Badge>;
    }
  };

  const getDisposalBadge = (method: string) => {
    switch (method) {
      case "incineration":
        return <Badge variant="outline" className="border-red-200 text-red-800">Incineration</Badge>;
      case "burial":
        return <Badge variant="outline" className="border-green-200 text-green-800">Burial</Badge>;
      case "rendering":
        return <Badge variant="outline" className="border-blue-200 text-blue-800">Rendering</Badge>;
      case "composting":
        return <Badge variant="outline" className="border-yellow-200 text-yellow-800">Composting</Badge>;
      default:
        return <Badge variant="secondary">{method}</Badge>;
    }
  };


  // Calculate mortality statistics
  const totalMortality = mortalityRecords.reduce((sum, record) => sum + record.count, 0);
  const diseaseMortality = mortalityRecords
    .filter(record => record.cause === "disease")
    .reduce((sum, record) => sum + record.count, 0);
  const injuryMortality = mortalityRecords
    .filter(record => record.cause === "injury")
    .reduce((sum, record) => sum + record.count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('pageTitle')}</h2>
        <p className="text-muted-foreground">
          {t('pageDescription')}
        </p>
      </div>

      {/* Mortality Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.totalMortality')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{totalMortality}</div>
                <p className="text-xs text-muted-foreground">{t('stats.birdsThisMonth')}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.diseaseRelated')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold text-red-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">{diseaseMortality}</div>
                <p className="text-xs text-muted-foreground">
                  {totalMortality > 0 ? Math.round((diseaseMortality / totalMortality) * 100) : 0}% {t('stats.ofTotal')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.injuryRelated')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold text-orange-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-orange-600">{injuryMortality}</div>
                <p className="text-xs text-muted-foreground">
                  {totalMortality > 0 ? Math.round((injuryMortality / totalMortality) * 100) : 0}% {t('stats.ofTotal')}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mortality Records Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>{t('recordsCount', { count: mortalityRecords.length })}</CardTitle>
              <CardDescription>
                {t('cardDescription')}
              </CardDescription>
            </div>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              {t('addMortality')}
            </Button>
            
            <MortalityDialog
              open={isAddDialogOpen}
              onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (!open) {
                  setEditingRecord(null);
                }
              }}
              initialData={editingRecord ? {
                id: editingRecord.id,
                flockId: editingRecord.flockId,
                date: new Date(editingRecord.date),
                count: editingRecord.count,
                cause: editingRecord.cause,
                causeDescription: editingRecord.causeDescription,
              } : undefined}
              onSuccess={() => {
                setIsAddDialogOpen(false);
                setEditingRecord(null);
                fetchMortalityRecords();
              }}
              loading={dialogLoading}
              onLoadingChange={setDialogLoading}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">{t('loadingData')}</p>
              </div>
            </div>
          ) : (
            <MortalityTable
              columns={mortalityColumns(handleEdit, handleDeleteClick, getCauseBadge)}
              data={mortalityRecords}
              flocks={flocks}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={t('deleteConfirmTitle')}
        desc={t('deleteConfirmDesc')}
        confirmText={t('deleteButton')}
        cancelBtnText={t('cancelButton')}
        destructive={confirmDialog.type === 'delete'}
        handleConfirm={handleConfirmAction}
        isLoading={actionLoading === confirmDialog.record?.id}
      />
    </div>
  );
}
