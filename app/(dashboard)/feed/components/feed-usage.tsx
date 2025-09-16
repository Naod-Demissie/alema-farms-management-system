"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Edit, Trash2, Calendar, TrendingUp } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Mock data for demonstration
const mockFlocks = [
  { id: "1", batchCode: "FL-2024-001", breed: "broiler", currentCount: 500 },
  { id: "2", batchCode: "FL-2024-002", breed: "layer", currentCount: 300 },
  { id: "3", batchCode: "FL-2024-003", breed: "dual_purpose", currentCount: 200 },
];

const mockFeedInventory = [
  { id: "1", name: "Starter Feed Premium", feedType: "starter", unit: "kg" },
  { id: "2", name: "Grower Feed Standard", feedType: "grower", unit: "kg" },
  { id: "3", name: "Layer Feed High Protein", feedType: "layer", unit: "kg" },
];

const mockFeedUsage = [
  {
    id: "1",
    flockId: "1",
    feedId: "1",
    date: new Date("2024-01-15"),
    amountUsed: 50,
    unit: "kg",
    cost: 125.00,
    notes: "Morning feeding",
    recordedBy: "John Doe",
  },
  {
    id: "2",
    flockId: "2",
    feedId: "3",
    date: new Date("2024-01-15"),
    amountUsed: 30,
    unit: "kg",
    cost: 90.00,
    notes: "Evening feeding",
    recordedBy: "Jane Smith",
  },
  {
    id: "3",
    flockId: "1",
    feedId: "2",
    date: new Date("2024-01-14"),
    amountUsed: 45,
    unit: "kg",
    cost: 99.00,
    notes: "Regular feeding",
    recordedBy: "John Doe",
  },
];

const feedUsageSchema = z.object({
  flockId: z.string().min(1, "Flock is required"),
  feedId: z.string().min(1, "Feed is required"),
  date: z.date(),
  amountUsed: z.number().min(0.1, "Amount must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  cost: z.number().min(0, "Cost must be positive").optional(),
  notes: z.string().optional(),
});

type FeedUsageFormData = z.infer<typeof feedUsageSchema>;

export function FeedUsage() {
  const [feedUsage, setFeedUsage] = useState(mockFeedUsage);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFlock, setFilterFlock] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });

  const form = useForm<FeedUsageFormData>({
    resolver: zodResolver(feedUsageSchema),
    defaultValues: {
      flockId: "",
      feedId: "",
      date: new Date(),
      amountUsed: 0,
      unit: "kg",
      cost: 0,
    },
  });

  const onSubmit = (data: FeedUsageFormData) => {
    if (editingItem) {
      // Update existing item
      setFeedUsage(prev => 
        prev.map(item => 
          item.id === editingItem.id 
            ? { ...item, ...data, id: editingItem.id }
            : item
        )
      );
    } else {
      // Add new item
      const newItem = {
        ...data,
        id: Date.now().toString(),
        recordedBy: "Current User", // This would come from auth context
      };
      setFeedUsage(prev => [...prev, newItem]);
    }
    
    setIsAddDialogOpen(false);
    setEditingItem(null);
    form.reset();
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    form.reset({
      flockId: item.flockId,
      feedId: item.feedId,
      date: item.date,
      amountUsed: item.amountUsed,
      unit: item.unit,
      cost: item.cost,
      notes: item.notes,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setFeedUsage(prev => prev.filter(item => item.id !== id));
  };

  const getFlockInfo = (flockId: string) => {
    return mockFlocks.find(flock => flock.id === flockId);
  };

  const getFeedInfo = (feedId: string) => {
    return mockFeedInventory.find(feed => feed.id === feedId);
  };

  const filteredUsage = feedUsage.filter(item => {
    const flock = getFlockInfo(item.flockId);
    const feed = getFeedInfo(item.feedId);
    const matchesSearch = 
      flock?.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feed?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFlock = filterFlock === "all" || item.flockId === filterFlock;
    const matchesDateRange = 
      (!dateRange.from || item.date >= dateRange.from) &&
      (!dateRange.to || item.date <= dateRange.to);
    
    return matchesSearch && matchesFlock && matchesDateRange;
  });

  const totalUsage = filteredUsage.reduce((sum, item) => sum + item.amountUsed, 0);
  const totalCost = filteredUsage.reduce((sum, item) => sum + (item.cost || 0), 0);
  const averageDailyUsage = filteredUsage.length > 0 
    ? totalUsage / new Set(filteredUsage.map(item => item.date.toDateString())).size 
    : 0;

  const columns = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }: any) => (
        <span>{new Date(row.getValue("date")).toLocaleDateString()}</span>
      ),
    },
    {
      accessorKey: "flockId",
      header: "Flock",
      cell: ({ row }: any) => {
        const flock = getFlockInfo(row.getValue("flockId"));
        return (
          <div>
            <div className="font-medium">{flock?.batchCode}</div>
            <div className="text-sm text-muted-foreground">
              {flock?.breed} ({flock?.currentCount} birds)
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "feedId",
      header: "Feed",
      cell: ({ row }: any) => {
        const feed = getFeedInfo(row.getValue("feedId"));
        return (
          <div>
            <div className="font-medium">{feed?.name}</div>
            <Badge variant="secondary" className="text-xs">
              {feed?.feedType}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "amountUsed",
      header: "Amount Used",
      cell: ({ row }: any) => (
        <span>{row.getValue("amountUsed")} {row.original.unit}</span>
      ),
    },
    {
      accessorKey: "cost",
      header: "Cost",
      cell: ({ row }: any) => (
        <span>${row.getValue("cost")?.toFixed(2) || "N/A"}</span>
      ),
    },
    {
      accessorKey: "recordedBy",
      header: "Recorded By",
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }: any) => (
        <span className="max-w-[200px] truncate">
          {row.getValue("notes") || "N/A"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">
              {filteredUsage.length} records
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageDailyUsage.toFixed(1)} kg</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Flocks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredUsage.map(item => item.flockId)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Feed Usage Tracking</CardTitle>
              <CardDescription>
                Track daily feed consumption per flock and monitor feeding patterns.
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingItem(null);
                  form.reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Usage
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Edit Feed Usage" : "Record Feed Usage"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingItem 
                      ? "Update the feed usage record below."
                      : "Record a new feed usage for a flock."
                    }
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="flockId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Flock</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select flock" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {mockFlocks.map((flock) => (
                                  <SelectItem key={flock.id} value={flock.id}>
                                    {flock.batchCode} ({flock.breed} - {flock.currentCount} birds)
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
                        name="feedId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Feed</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select feed" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {mockFeedInventory.map((feed) => (
                                  <SelectItem key={feed.id} value={feed.id}>
                                    {feed.name} ({feed.feedType})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <Input 
                                type="date"
                                {...field}
                                value={field.value ? field.value.toISOString().split('T')[0] : ''}
                                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : new Date())}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="amountUsed"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount Used</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1"
                                placeholder="0.0" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit</FormLabel>
                            <FormControl>
                              <Input placeholder="kg" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Additional notes about this feeding..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingItem ? "Update" : "Record"} Usage
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search usage records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterFlock} onValueChange={setFilterFlock}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by flock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Flocks</SelectItem>
                {mockFlocks.map((flock) => (
                  <SelectItem key={flock.id} value={flock.id}>
                    {flock.batchCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex space-x-2">
              <Input
                type="date"
                placeholder="From"
                value={dateRange.from ? dateRange.from.toISOString().split('T')[0] : ''}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value ? new Date(e.target.value) : null }))}
                className="w-[140px]"
              />
              <Input
                type="date"
                placeholder="To"
                value={dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value ? new Date(e.target.value) : null }))}
                className="w-[140px]"
              />
            </div>
          </div>
          
          <DataTable columns={columns} data={filteredUsage} />
        </CardContent>
      </Card>
    </div>
  );
}
