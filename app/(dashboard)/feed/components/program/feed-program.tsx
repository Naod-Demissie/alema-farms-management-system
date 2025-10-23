"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, TrendingUp, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { 
  getFeedProgramAction, 
  createFeedProgramAction, 
  updateFeedProgramAction, 
  deleteFeedProgramAction 
} from "@/app/(dashboard)/feed/server/feed-program";
import { feedTypeColors } from "../../utils/feed-program";
import { ProgramTable } from "./program-table";
import { programColumns } from "./program-columns";

const feedProgramSchema = z.object({
  ageInWeeks: z.number().min(1, "Age in weeks must be at least 1"),
  ageInDays: z.string().min(1, "Age in days is required"),
  feedType: z.enum(["LAYER_STARTER", "REARING", "PULLET_FEED", "LAYER", "LAYER_PHASE_1", "CUSTOM"]),
  gramPerHen: z.number().min(0.1, "Grams per hen must be greater than 0"),
});

type FeedProgramFormData = z.infer<typeof feedProgramSchema>;

export function FeedProgram() {
  const t = useTranslations('feed.program');
  const tFeedTypes = useTranslations('feed.feedTypes');
  const [program, setProgram] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | null;
    item: any | null;
  }>({
    open: false,
    type: null,
    item: null,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const form = useForm<FeedProgramFormData>({
    resolver: zodResolver(feedProgramSchema),
    defaultValues: {
      ageInWeeks: 1,
      ageInDays: "1-7",
      feedType: "LAYER_STARTER",
      gramPerHen: 10,
    },
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchProgram();
  }, []);

  const fetchProgram = async () => {
    setLoading(true);
    try {
      const result = await getFeedProgramAction();
      if (result.success) {
        setProgram(result.data || []);
      } else {
        toast.error(result.error || t('toasts.unexpectedError'));
      }
    } catch (error) {
      console.error("Error fetching feed program:", error);
      toast.error(t('toasts.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.reset({
      ageInWeeks: 1,
      ageInDays: "1-7",
      feedType: "LAYER_STARTER",
      gramPerHen: 10,
    });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    form.reset({
      ageInWeeks: item.ageInWeeks,
      ageInDays: item.ageInDays,
      feedType: item.feedType,
      gramPerHen: item.gramPerHen,
    });
    setIsAddDialogOpen(true);
  };

  const handleView = (item: any) => {
    setViewingItem(item);
    setIsViewDialogOpen(true);
  };

  const handleDelete = (item: any) => {
    setConfirmDialog({
      open: true,
      type: 'delete',
      item: item,
    });
  };

  const handleSubmit = async (data: FeedProgramFormData) => {
    try {
      setLoading(true);
      let result;
      if (editingItem) {
        result = await updateFeedProgramAction(editingItem.id, data);
      } else {
        result = await createFeedProgramAction(data);
      }

      if (result.success) {
        toast.success(editingItem ? t('toasts.updated') : t('toasts.created'));
        setIsAddDialogOpen(false);
        setEditingItem(null);
        form.reset();
        fetchProgram();
      } else {
        toast.error(result.error || (editingItem ? t('toasts.updateError') : t('toasts.createError')));
      }
    } catch (error) {
      console.error("Error saving feed program:", error);
      toast.error(editingItem ? t('toasts.updateError') : t('toasts.createError'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (confirmDialog.type === 'delete' && confirmDialog.item) {
      setActionLoading(confirmDialog.item.id);
      try {
        const result = await deleteFeedProgramAction(confirmDialog.item.id);
        if (result.success) {
          toast.success(t('toasts.deleted'));
          fetchProgram();
        } else {
          toast.error(result.error || t('toasts.deleteError'));
        }
      } catch (error) {
        console.error("Error deleting feed program:", error);
        toast.error(t('toasts.deleteError'));
      } finally {
        setActionLoading(null);
        setConfirmDialog({ open: false, type: null, item: null });
      }
    }
  };

  const columns = programColumns(handleView, handleEdit, handleDelete, t, tCommon, tFeedTypes);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t('table.title')}
              </CardTitle>
              <CardDescription>
                {t('table.description')}
              </CardDescription>
            </div>
            <Button onClick={handleAdd} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t('addProgram')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ProgramTable
            columns={columns}
            data={program}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? t('dialog.editTitle') : t('dialog.addTitle')}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? t('dialog.editDescription') : t('dialog.addDescription')}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* First Row - 2 fields */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ageInWeeks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        {t('form.weekLabel')} <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder={t('form.weekPlaceholder')}
                          className="w-full"
                          value={field.value === 1 ? "" : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === "" ? 1 : parseInt(value) || 1);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ageInDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        {t('columns.ageRange')} <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="1-7, 8-14"
                          className="w-full"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Second Row - 2 fields */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="feedType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        {t('form.feedTypeLabel')} <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t('form.feedTypePlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LAYER_STARTER">{tFeedTypes('LAYER_STARTER')}</SelectItem>
                          <SelectItem value="REARING">{tFeedTypes('REARING')}</SelectItem>
                          <SelectItem value="PULLET_FEED">{tFeedTypes('PULLET_FEED')}</SelectItem>
                          <SelectItem value="LAYER">{tFeedTypes('LAYER')}</SelectItem>
                          <SelectItem value="LAYER_PHASE_1">{tFeedTypes('LAYER_PHASE_1')}</SelectItem>
                          <SelectItem value="CUSTOM">{tFeedTypes('CUSTOM')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gramPerHen"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        {t('form.gramsPerHenLabel')} <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          placeholder={t('form.gramsPerHenPlaceholder')}
                          className="w-full"
                          value={field.value === 0.1 ? "" : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === "" ? 0.1 : parseFloat(value) || 0.1);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  {t('form.cancelButton')}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingItem ? t('form.updateButton') : t('form.submitButton')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('dialog.viewTitle')}</DialogTitle>
            <DialogDescription>
              {t('dialog.viewDescription')}
            </DialogDescription>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('week')}</Label>
                  <p className="text-sm font-medium">{viewingItem.ageInWeeks}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('ageRange')}</Label>
                  <p className="text-sm font-medium">{viewingItem.ageInDays}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">{t('columns.feedType')}</Label>
                <div className="mt-1">
                  <Badge variant="outline" className={feedTypeColors[viewingItem.feedType as keyof typeof feedTypeColors] || "bg-gray-100 text-gray-800"}>
                    {tFeedTypes(viewingItem.feedType, { defaultValue: viewingItem.feedType })}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">{t('columns.gramsPerHen')}</Label>
                <p className="text-sm font-medium">{viewingItem.gramPerHen}g</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              {t('form.closeButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={t('dialog.deleteTitle')}
        desc={t('dialog.deleteDescription')}
        confirmText={t('form.deleteButton')}
        cancelBtnText={t('form.cancelButton')}
        destructive={true}
        handleConfirm={handleConfirmAction}
        isLoading={actionLoading === confirmDialog.item?.id}
      />
    </div>
  );
}
