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
import { Plus, Edit, Trash2, DollarSign, TrendingUp } from "lucide-react";
import { RevenueFormData, REVENUE_SOURCES, FinancialFilters } from "@/features/financial/types";
import { RevenueSource } from "@prisma/client";

interface Revenue {
  id: string;
  flockId: string;
  source: RevenueSource;
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

const revenueColumns = [
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
    accessorKey: "source",
    header: "Source",
    cell: ({ row }: { row: any }) => {
      const source = row.getValue("source");
      const sourceConfig = REVENUE_SOURCES.find(s => s.value === source);
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          {sourceConfig?.label || source}
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
      const revenue = row.original;
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(revenue.id)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(revenue.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];

export function RevenueManagement() {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null);
  const [filters, setFilters] = useState<FinancialFilters>({});
  
  const [formData, setFormData] = useState<RevenueFormData>({
    flockId: "",
    source: "egg_sales",
    amount: 0,
    date: new Date(),
    description: "",
  });

  useEffect(() => {
    fetchRevenues();
    fetchFlocks();
  }, [filters]);

  const fetchRevenues = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.flockId) queryParams.append("flockId", filters.flockId);
      if (filters.startDate) queryParams.append("startDate", filters.startDate.toISOString());
      if (filters.endDate) queryParams.append("endDate", filters.endDate.toISOString());
      if (filters.source) queryParams.append("source", filters.source);

      const response = await fetch(`/api/financial/revenue?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setRevenues(data);
      }
    } catch (error) {
      console.error("Error fetching revenues:", error);
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
      const url = editingRevenue 
        ? `/api/financial/revenue/${editingRevenue.id}`
        : "/api/financial/revenue";
      
      const method = editingRevenue ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        setEditingRevenue(null);
        setFormData({
          flockId: "",
          source: "egg_sales",
          amount: 0,
          date: new Date(),
          description: "",
        });
        fetchRevenues();
      }
    } catch (error) {
      console.error("Error saving revenue:", error);
    }
  };

  const handleEdit = (revenueId: string) => {
    const revenue = revenues.find(r => r.id === revenueId);
    if (revenue) {
      setEditingRevenue(revenue);
      setFormData({
        flockId: revenue.flockId,
        source: revenue.source,
        amount: revenue.amount,
        date: new Date(revenue.date),
        description: revenue.description || "",
      });
      setIsDialogOpen(true);
    }
  };

  const handleDelete = async (revenueId: string) => {
    if (confirm("Are you sure you want to delete this revenue record?")) {
      try {
        const response = await fetch(`/api/financial/revenue/${revenueId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchRevenues();
        }
      } catch (error) {
        console.error("Error deleting revenue:", error);
      }
    }
  };

  const totalRevenue = revenues.reduce((sum, revenue) => sum + revenue.amount, 0);
  const sourceSummary = REVENUE_SOURCES.map(source => {
    const sourceRevenues = revenues.filter(r => r.source === source.value);
    const total = sourceRevenues.reduce((sum, r) => sum + r.amount, 0);
    return {
      source: source.value,
      label: source.label,
      total,
      percentage: totalRevenue > 0 ? (total / totalRevenue) * 100 : 0,
      count: sourceRevenues.length,
    };
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenues.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(
                revenues
                  .filter(r => {
                    const revenueDate = new Date(r.date);
                    const now = new Date();
                    return revenueDate.getMonth() === now.getMonth() && 
                           revenueDate.getFullYear() === now.getFullYear();
                  })
                  .reduce((sum, r) => sum + r.amount, 0)
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
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(revenues.length > 0 ? totalRevenue / revenues.length : 0)}
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
              <Label htmlFor="source-filter">Source</Label>
              <Select
                value={filters.source || "all"}
                onValueChange={(value) => setFilters({ ...filters, source: value === "all" ? undefined : value as RevenueSource })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {REVENUE_SOURCES.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
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

      {/* Source Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Summary by Source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sourceSummary.map((summary) => (
              <div key={summary.source} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {summary.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {summary.count} records
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-green-600">
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

      {/* Revenue Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Track and manage all farm revenue</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingRevenue(null);
                setFormData({
                  flockId: "",
                  source: "egg_sales",
                  amount: 0,
                  date: new Date(),
                  description: "",
                });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Revenue
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingRevenue ? "Edit Revenue" : "Add New Revenue"}
                </DialogTitle>
                <DialogDescription>
                  {editingRevenue ? "Update revenue details" : "Record a new revenue for your farm"}
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
                    <Label htmlFor="source">Source</Label>
                    <Select
                      value={formData.source}
                      onValueChange={(value) => setFormData({ ...formData, source: value as RevenueSource })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {REVENUE_SOURCES.map((source) => (
                          <SelectItem key={source.value} value={source.value}>
                            {source.label}
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
                      placeholder="Additional details about this revenue..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingRevenue ? "Update Revenue" : "Add Revenue"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={revenueColumns}
            data={revenues}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
