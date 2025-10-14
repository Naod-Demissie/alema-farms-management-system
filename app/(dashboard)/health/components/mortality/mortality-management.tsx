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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { format } from "date-fns";
import { getFlocks } from "@/app/(dashboard)/flocks/server/flocks";
import { getStaff } from "@/app/(dashboard)/staff/server/staff";
import { 
  getMortalityRecords, 
  createMortalityRecord, 
  updateMortalityRecord, 
  deleteMortalityRecord 
} from "@/app/(dashboard)/health/server/health";

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
  const [flocks, setFlocks] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [loading, setLoading] = useState(false);
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
    fetchStaff();
  }, []);

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

  const fetchFlocks = async () => {
    try {
      const result = await getFlocks({}, { page: 1, limit: 100 });
      if (result && result.success && result.data) {
        setFlocks(result.data);
      }
    } catch (error) {
      console.error("Error fetching flocks:", error);
    }
  };

  const fetchStaff = async () => {
    try {
      const result = await getStaff();
      if (result && result.success && result.data) {
        setStaff(result.data);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  const handleSubmit = async (data: z.infer<typeof mortalitySchema>) => {
    try {
      setLoading(true);
      const result = await createMortalityRecord({
        ...data,
        date: data.date.toISOString(),
      });
      
      if (result.success) {
        toast.success(t('createSuccess'), {
          description: t('createSuccessDesc', { count: data.count }),
        });
        await fetchMortalityRecords();
        setIsAddDialogOpen(false);
        form.reset();
      } else {
        toast.error(t('createError'), {
          description: result.message || t('unexpectedError'),
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

  const handleUpdate = async (data: z.infer<typeof mortalitySchema>) => {
    if (!editingRecord) return;
    
    try {
      setLoading(true);
      const result = await updateMortalityRecord(editingRecord.id, {
        ...data,
        date: data.date.toISOString(),
      });
      
      if (result.success) {
        toast.success(t('updateSuccess'), {
          description: t('updateSuccessDesc'),
        });
        await fetchMortalityRecords();
        setIsAddDialogOpen(false);
        setEditingRecord(null);
        form.reset();
      } else {
        toast.error(t('updateError'), {
          description: result.message || t('unexpectedError'),
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
  
  // Calculate overall mortality rate
  const totalBirds = flocks.reduce((sum, flock) => sum + (flock.initialCount || 0), 0);
  const mortalityRate = totalBirds > 0 ? (totalMortality / totalBirds) * 100 : 0;

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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.mortalityRate')}</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{mortalityRate.toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">-0.2%</span> {t('stats.fromLastMonth')}
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
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addButton')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl w-[95vw] max-h-[85vh]">
                <DialogHeader>
                  <DialogTitle>
                    {editingRecord ? t('editTitle') : t('addNewTitle')}
                  </DialogTitle>
                  <DialogDescription>
                    {t('addNewDescription')}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(editingRecord ? handleUpdate : handleSubmit)} className="space-y-4">
                    {/* Row 1: Flock ID, Date, and Number of Deaths */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <FormField
                        control={form.control}
                        name="flockId"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="flex items-center gap-1">
                              {t('form.flockId')} <span className="text-red-500">*</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="w-full h-10">
                                  <SelectValue placeholder={t('form.selectFlock')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {flocks.map((flock: any) => (
                                  <SelectItem key={flock.id} value={flock.id}>
                                    {flock.batchCode}
                                  </SelectItem>
                                ))}
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
                          <FormItem className="flex-1">
                            <FormLabel className="flex items-center gap-1">
                              {t('form.date')} <span className="text-red-500">*</span>
                            </FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal h-10",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "MMM dd, yyyy")
                                    ) : (
                                      <span>{t('form.pickDate')}</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  captionLayout="dropdown"
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="count"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="flex items-center gap-1 whitespace-nowrap">
                              {t('form.numberOfDeaths')} <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="1"
                                className="h-10"
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value === "" ? 0 : parseInt(value) || 0);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Row 2: Recorded By and Cause of Death - Full Width */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <FormField
                        control={form.control}
                        name="recordedBy"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="flex items-center gap-1">
                              {t('form.recordedBy')} <span className="text-red-500">*</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="w-full h-10">
                                  <SelectValue placeholder={t('form.selectStaff')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {staff.map((person: any) => (
                                  <SelectItem key={person.id} value={person.id}>
                                    {person.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cause"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="flex items-center gap-1">
                              {t('form.causeOfDeath')} <span className="text-red-500">*</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="w-full h-10">
                                  <SelectValue placeholder={t('form.selectCause')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="disease">{t('causeTypes.disease')}</SelectItem>
                                <SelectItem value="injury">{t('causeTypes.injury')}</SelectItem>
                                <SelectItem value="environmental">{t('causeTypes.environmental')}</SelectItem>
                                <SelectItem value="unknown">{t('causeTypes.unknown')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Row 3: Cause Description */}
                    <FormField
                      control={form.control}
                      name="causeDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            {t('form.causeDescription')} <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('form.causeDescriptionPlaceholder')}
                              rows={3}
                              className="resize-none min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        {t('cancelButton')}
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {loading ? t('saving') : editingRecord ? t('updateButton') : t('addButton')}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
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
