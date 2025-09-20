"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, DollarSign, Eye } from "lucide-react";
import { ExpenseFormData, EXPENSE_CATEGORIES } from "@/features/financial/types";
import { ExpenseCategory } from "@/lib/generated/prisma";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense
} from "@/server/financial";
import { getFlocks } from "@/server/flocks";
import { toast } from "sonner";
import { ExpenseTable } from "./expense-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { format } from "date-fns";

interface Expense {
  id: string;
  flockId: string;
  category: ExpenseCategory;
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

interface Flock {
  id: string;
  batchCode: string;
  breed: string;
}


export function ExpenseTracking() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [flocks, setFlocks] = useState<Flock[]>([]);
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
  
  const [formData, setFormData] = useState<ExpenseFormData>({
    flockId: "",
    category: "feed",
    amount: 0,
    date: new Date(),
    description: "",
  });

  useEffect(() => {
    fetchExpenses();
    fetchFlocks();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const result = await getExpenses({});
      if (result.success) {
        setExpenses(result.data || []);
      } else {
        toast.error(result.message || "Failed to fetch expenses");
        setExpenses([]);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Failed to fetch expenses");
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlocks = async () => {
    try {
      const result = await getFlocks({}, { page: 1, limit: 100 });
      if (result.success && result.data) {
        setFlocks(result.data.map(flock => ({
          id: flock.id,
          batchCode: flock.batchCode,
          breed: flock.breed
        })));
      } else {
        toast.error("Failed to fetch flocks");
        setFlocks([]);
      }
    } catch (error) {
      console.error("Error fetching flocks:", error);
      toast.error("Failed to fetch flocks");
      setFlocks([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let result;
      if (editingExpense) {
        result = await updateExpense(editingExpense.id, {
          category: formData.category,
          amount: formData.amount,
          date: formData.date,
          description: formData.description,
        });
      } else {
        result = await createExpense({
          flockId: formData.flockId,
          category: formData.category,
          amount: formData.amount,
          date: formData.date,
          description: formData.description,
        });
      }

      if (result.success) {
        toast.success(editingExpense ? "Expense updated successfully" : "Expense created successfully");
        setIsDialogOpen(false);
        setEditingExpense(null);
        setFormData({
          flockId: "",
          category: "feed",
          amount: 0,
          date: new Date(),
          description: "",
        });
        fetchExpenses();
      } else {
        toast.error(result.message || "Failed to save expense");
      }
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("Failed to save expense");
    }
  };

  const handleView = (expense: Expense) => {
    setViewingExpense(expense);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      flockId: expense.flockId,
      category: expense.category,
      amount: expense.amount,
      date: new Date(expense.date),
      description: expense.description || "",
    });
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
        toast.success("Expense deleted successfully");
        fetchExpenses();
        setConfirmDialog({ open: false, type: null, record: null });
      } else {
        toast.error(result.message || "Failed to delete expense");
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    } finally {
      setActionLoading(null);
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
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
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                   <div className="text-2xl font-bold">
                     {new Intl.NumberFormat("en-ET", {
                       style: "currency",
                       currency: "ETB",
                     }).format(totalExpenses)}
                   </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenses.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                   <div className="text-2xl font-bold">
                     {new Intl.NumberFormat("en-ET", {
                       style: "currency",
                       currency: "ETB",
                     }).format(
                       expenses
                         .filter(e => {
                           const expenseDate = new Date(e.date);
                           const now = new Date();
                           return expenseDate.getMonth() === now.getMonth() &&
                                  expenseDate.getFullYear() === now.getFullYear();
                         })
                         .reduce((sum, e) => sum + e.amount, 0)
                     )}
                   </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Record</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                   <div className="text-2xl font-bold">
                     {new Intl.NumberFormat("en-ET", {
                       style: "currency",
                       currency: "ETB",
                     }).format(expenses.length > 0 ? totalExpenses / expenses.length : 0)}
                   </div>
          </CardContent>
        </Card>
      </div>



      {/* Expenses Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Expenses</CardTitle>
            <CardDescription>Track and manage all farm expenses</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingExpense(null);
                setFormData({
                  flockId: "",
                  category: "feed",
                  amount: 0,
                  date: new Date(),
                  description: "",
                });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingExpense ? "Edit Expense" : "Add New Expense"}
                </DialogTitle>
                <DialogDescription>
                  {editingExpense ? "Update expense details" : "Record a new expense for your farm"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="flock">Flock</Label>
                    <Select
                      value={formData.flockId}
                      onValueChange={(value) => setFormData({ ...formData, flockId: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select flock" />
                      </SelectTrigger>
                      <SelectContent>
                        {flocks.map((flock) => (
                          <SelectItem key={flock.id} value={flock.id}>
                            {flock.batchCode} ({flock.breed})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value as ExpenseCategory })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date.toISOString().split('T')[0]}
                      onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Additional details about this expense..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingExpense ? "Update Expense" : "Add Expense"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
               <CardContent>
                 <ExpenseTable
                   data={expenses}
                   onView={handleView}
                   onEdit={handleEdit}
                   onDelete={handleDeleteClick}
                   flocks={flocks}
                   loading={loading}
                 />
               </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
            <DialogDescription>
              View detailed information about this expense record
            </DialogDescription>
          </DialogHeader>
          {viewingExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                  <p className="text-sm font-medium">
                    {format(new Date(viewingExpense.date), "PPP")}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Flock</Label>
                  <p className="text-sm font-medium">
                    {viewingExpense.flock.batchCode} ({viewingExpense.flock.breed})
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                  <p className="text-sm font-medium">
                    {EXPENSE_CATEGORIES.find(c => c.value === viewingExpense.category)?.label || viewingExpense.category}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                  <p className="text-sm font-medium">
                    {new Intl.NumberFormat("en-ET", {
                      style: "currency",
                      currency: "ETB",
                    }).format(viewingExpense.amount)}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                  {viewingExpense.description || "No description provided"}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              handleEdit(viewingExpense!);
            }}>
              Edit Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title="Delete Expense"
        desc={`Are you sure you want to delete this expense record? This action cannot be undone and the record will be permanently removed.`}
        confirmText="Delete Expense"
        cancelBtnText="Cancel"
        destructive={true}
        handleConfirm={handleConfirmAction}
        isLoading={actionLoading === confirmDialog.record?.id}
      />
    </div>
  );
}
