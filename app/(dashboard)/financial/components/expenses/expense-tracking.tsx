"use client";

import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, DollarSign, Eye } from "lucide-react";
import { ExpenseFormData, EXPENSE_CATEGORIES } from "../../types/types";
import { ExpenseCategory } from "@/lib/generated/prisma/enums";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense
} from "@/app/(dashboard)/financial/server/financial";
import { toast } from "sonner";
import { ExpenseTable } from "./expense-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { getExpenseCategoryBadgeColor } from "../../utils/badge-colors";
import { format } from "date-fns";
import { EthiopianDateFormatter } from "@/lib/ethiopian-date-formatter";
import { ExpenseDialog } from "./expense-dialog";

interface Expense {
  id: string;
  flockId: string;
  category: string;
  quantity: number | null;
  costPerQuantity: number | null;
  amount: number;
  date: Date;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  flock: {
    batchCode: string;
    breed: string;
  };
}



export function ExpenseTracking() {
  const t = useTranslations('financial.expenses');
  const tCommon = useTranslations('financial.common');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: null as string | null,
    record: null as Expense | null,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const result = await getExpenses({});
      if (result.success) {
        setExpenses((result.data || []) as Expense[]);
      } else {
        toast.error(result.message || t('toasts.fetchError'));
        setExpenses([]);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error(t('toasts.fetchError'));
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };


  const handleExpenseSubmit = async (data: ExpenseFormData) => {
    try {
      let result;
      if (editingExpense) {
        result = await updateExpense(editingExpense.id, {
          category: data.category,
          quantity: data.quantity,
          costPerQuantity: data.costPerQuantity,
          amount: data.amount,
          date: data.date,
          description: data.description,
        });
      } else {
        result = await createExpense({
          category: data.category,
          quantity: data.quantity,
          costPerQuantity: data.costPerQuantity,
          amount: data.amount,
          date: data.date,
          description: data.description,
        });
      }

      if (result.success) {
        toast.success(editingExpense ? t('toasts.updateSuccess') : t('toasts.createSuccess'));
        setIsDialogOpen(false);
        setEditingExpense(null);
        fetchExpenses();
      } else {
        toast.error(result.message || (editingExpense ? t('toasts.updateError') : t('toasts.createError')));
      }
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error(editingExpense ? t('toasts.updateError') : t('toasts.createError'));
    }
  };

  const handleView = (expense: Expense) => {
    setViewingExpense(expense);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (expense: Expense) => {
    setConfirmDialog({
      open: true,
      type: "delete",
      record: expense,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.record) return;

    setActionLoading(confirmDialog.record.id);
    try {
      const result = await deleteExpense(confirmDialog.record.id);
      if (result.success) {
        toast.success(t('toasts.deleteSuccess'));
        fetchExpenses();
        setConfirmDialog({ open: false, type: null, record: null });
      } else {
        toast.error(result.message || t('toasts.deleteError'));
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error(t('toasts.deleteError'));
    } finally {
      setActionLoading(null);
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Calculate expenses for different time periods
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const todayExpenses = expenses
    .filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate >= today && expenseDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const thisWeekExpenses = expenses
    .filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate >= startOfWeek;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const thisMonthExpenses = expenses
    .filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate >= startOfMonth;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const thisYearExpenses = expenses
    .filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate >= startOfYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const categorySummary = EXPENSE_CATEGORIES.map(category => {
    const categoryExpenses = expenses.filter(e => e.category === category.value);
    const total = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      category: category.value,
      label: category.label,
      total,
      percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
      count: categoryExpenses.length,
    };
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cards.todayExpenses')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold text-red-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {new Intl.NumberFormat("en-ET", {
                  style: "currency",
                  currency: "ETB",
                }).format(todayExpenses)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cards.weekExpenses')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold text-red-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {new Intl.NumberFormat("en-ET", {
                  style: "currency",
                  currency: "ETB",
                }).format(thisWeekExpenses)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cards.monthExpenses')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold text-red-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {new Intl.NumberFormat("en-ET", {
                  style: "currency",
                  currency: "ETB",
                }).format(thisMonthExpenses)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cards.yearExpenses')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold text-red-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {new Intl.NumberFormat("en-ET", {
                  style: "currency",
                  currency: "ETB",
                }).format(thisYearExpenses)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>



      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>{t('title')}</CardTitle>
              <CardDescription>{t('pageDescription')}</CardDescription>
            </div>
            <Button onClick={() => {
              setEditingExpense(null);
              setIsDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              {t('addExpense')}
            </Button>
          </div>
        </CardHeader>
               <CardContent>
                 <ExpenseTable
                   data={expenses}
                   onView={handleView}
                   onEdit={handleEdit}
                   onDelete={handleDeleteClick}
                   loading={loading}
                 />
               </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('dialogs.view.title')}</DialogTitle>
            <DialogDescription>
              {t('dialogs.view.description')}
            </DialogDescription>
          </DialogHeader>
          {viewingExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{tCommon('date')}</Label>
                  <p className="text-sm font-medium">
                    {EthiopianDateFormatter.formatForTable(new Date(viewingExpense.date))}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{tCommon('category')}</Label>
                  <div className="mt-1">
                    <Badge className={getExpenseCategoryBadgeColor(viewingExpense.category as any)}>
                      {EXPENSE_CATEGORIES.find(c => c.value === viewingExpense.category)?.label || viewingExpense.category}
                    </Badge>
                  </div>
                </div>
                {viewingExpense.quantity && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{tCommon('quantity')}</Label>
                    <p className="text-sm font-medium">{viewingExpense.quantity}</p>
                  </div>
                )}
                {viewingExpense.costPerQuantity && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{tCommon('costPerQuantity')}</Label>
                    <p className="text-sm font-medium">
                      {new Intl.NumberFormat("en-ET", {
                        style: "currency",
                        currency: "ETB",
                      }).format(viewingExpense.costPerQuantity)}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('form.amount')}</Label>
                  <p className="text-lg font-semibold text-red-600">
                    {new Intl.NumberFormat("en-ET", {
                      style: "currency",
                      currency: "ETB",
                    }).format(viewingExpense.amount)}
                  </p>
                  {viewingExpense.quantity && viewingExpense.costPerQuantity && (
                    <p className="text-xs text-muted-foreground">
                      Calculated: {viewingExpense.quantity} × {viewingExpense.costPerQuantity} = {viewingExpense.quantity * viewingExpense.costPerQuantity}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">{tCommon('description')}</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                  {viewingExpense.description || t('dialogs.view.noDescription')}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              {tCommon('close')}
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              handleEdit(viewingExpense!);
            }}>
              {t('editExpense')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reusable Expense Dialog */}
      <ExpenseDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingExpense(null);
        }}
        onSubmit={handleExpenseSubmit}
        initialData={editingExpense ? {
          category: editingExpense.category as ExpenseCategory,
          quantity: editingExpense.quantity || 0,
          costPerQuantity: editingExpense.costPerQuantity || 0,
          amount: editingExpense.amount,
          date: new Date(editingExpense.date),
          description: editingExpense.description || "",
        } : undefined}
        title={editingExpense ? t('dialogs.edit.title') : t('dialogs.add.title')}
        description={editingExpense ? t('dialogs.edit.description') : t('dialogs.add.description')}
        submitButtonText={editingExpense ? t('editExpense') : t('addExpense')}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={t('dialogs.delete.title')}
        desc={t('dialogs.delete.description')}
        confirmText={t('deleteExpense')}
        cancelBtnText={tCommon('cancel')}
        destructive={true}
        handleConfirm={handleConfirmAction}
        isLoading={actionLoading === confirmDialog.record?.id}
      />
    </div>
  );
}
