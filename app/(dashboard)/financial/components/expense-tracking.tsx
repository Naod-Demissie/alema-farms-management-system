"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, DollarSign } from "lucide-react";
import { ExpenseFormData, EXPENSE_CATEGORIES, FinancialFilters } from "@/features/financial/types";
import { ExpenseCategory } from "@prisma/client";

interface Expense {
  id: string;
  flockId: string;
  category: ExpenseCategory;
  amount: number;
  date: Date;
  description?: string;
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

const expenseColumns = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }: { row: any }) => {
      return new Date(row.getValue("date")).toLocaleDateString();
    },
  },
  {
    accessorKey: "flock.batchCode",
    header: "Flock",
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }: { row: any }) => {
      const category = row.getValue("category");
      const categoryConfig = EXPENSE_CATEGORIES.find(c => c.value === category);
      return (
        <Badge variant="outline">
          {categoryConfig?.label || category}
        </Badge>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }: { row: any }) => {
      const amount = parseFloat(row.getValue("amount"));
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    id: "actions",
    cell: ({ row }: { row: any }) => {
      const expense = row.original;
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(expense.id)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(expense.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];

export function ExpenseTracking() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filters, setFilters] = useState<FinancialFilters>({});
  
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
  }, [filters]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.flockId) queryParams.append("flockId", filters.flockId);
      if (filters.startDate) queryParams.append("startDate", filters.startDate.toISOString());
      if (filters.endDate) queryParams.append("endDate", filters.endDate.toISOString());
      if (filters.category) queryParams.append("category", filters.category);

      const response = await fetch(`/api/financial/expenses?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlocks = async () => {
    try {
      const response = await fetch("/api/flocks");
      if (response.ok) {
        const data = await response.json();
        setFlocks(data);
      }
    } catch (error) {
      console.error("Error fetching flocks:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingExpense 
        ? `/api/financial/expenses/${editingExpense.id}`
        : "/api/financial/expenses";
      
      const method = editingExpense ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
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
      }
    } catch (error) {
      console.error("Error saving expense:", error);
    }
  };

  const handleEdit = (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        flockId: expense.flockId,
        category: expense.category,
        amount: expense.amount,
        date: new Date(expense.date),
        description: expense.description || "",
      });
      setIsDialogOpen(true);
    }
  };

  const handleDelete = async (expenseId: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      try {
        const response = await fetch(`/api/financial/expenses/${expenseId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchExpenses();
        }
      } catch (error) {
        console.error("Error deleting expense:", error);
      }
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
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
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
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
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
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(expenses.length > 0 ? totalExpenses / expenses.length : 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="flock-filter">Flock</Label>
              <Select
                value={filters.flockId || "all"}
                onValueChange={(value) => setFilters({ ...filters, flockId: value === "all" ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Flocks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Flocks</SelectItem>
                  {flocks.map((flock) => (
                    <SelectItem key={flock.id} value={flock.id}>
                      {flock.batchCode} ({flock.breed})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category-filter">Category</Label>
              <Select
                value={filters.category || "all"}
                onValueChange={(value) => setFilters({ ...filters, category: value === "all" ? undefined : value as ExpenseCategory })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={filters.startDate?.toISOString().split('T')[0] || ""}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  startDate: e.target.value ? new Date(e.target.value) : undefined 
                })}
              />
            </div>

            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={filters.endDate?.toISOString().split('T')[0] || ""}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  endDate: e.target.value ? new Date(e.target.value) : undefined 
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Summary by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {categorySummary.map((summary) => (
              <div key={summary.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{summary.label}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {summary.count} records
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(summary.total)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {summary.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
          <DataTable
            columns={expenseColumns}
            data={expenses}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
