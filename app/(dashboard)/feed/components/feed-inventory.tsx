"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Edit, Trash2, AlertTriangle } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Mock data for demonstration
const mockFeedInventory = [
  {
    id: "1",
    name: "Starter Feed Premium",
    feedType: "starter",
    supplier: "AgriFeed Co.",
    quantity: 500,
    unit: "kg",
    costPerUnit: 2.50,
    minStock: 100,
    maxStock: 1000,
    expiryDate: new Date("2024-12-31"),
    batchNumber: "SF-2024-001",
    isActive: true,
  },
  {
    id: "2",
    name: "Grower Feed Standard",
    feedType: "grower",
    supplier: "Farm Supplies Ltd",
    quantity: 750,
    unit: "kg",
    costPerUnit: 2.20,
    minStock: 150,
    maxStock: 1200,
    expiryDate: new Date("2024-11-15"),
    batchNumber: "GF-2024-002",
    isActive: true,
  },
  {
    id: "3",
    name: "Layer Feed High Protein",
    feedType: "layer",
    supplier: "Poultry Nutrition Inc",
    quantity: 200,
    unit: "kg",
    costPerUnit: 3.00,
    minStock: 50,
    maxStock: 800,
    expiryDate: new Date("2024-10-20"),
    batchNumber: "LF-2024-003",
    isActive: true,
  },
];

const feedTypeLabels = {
  starter: "Starter",
  grower: "Grower", 
  finisher: "Finisher",
  layer: "Layer",
  custom: "Custom"
};

const feedInventorySchema = z.object({
  name: z.string().min(1, "Feed name is required"),
  feedType: z.enum(["starter", "grower", "finisher", "layer", "custom"]),
  supplierId: z.string().optional(),
  quantity: z.number().min(0, "Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  costPerUnit: z.number().min(0, "Cost must be positive").optional(),
  minStock: z.number().min(0, "Minimum stock must be positive").optional(),
  maxStock: z.number().min(0, "Maximum stock must be positive").optional(),
  expiryDate: z.date().optional(),
  batchNumber: z.string().optional(),
  notes: z.string().optional(),
});

type FeedInventoryFormData = z.infer<typeof feedInventorySchema>;

export function FeedInventory() {
  const [inventory, setInventory] = useState(mockFeedInventory);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const form = useForm<FeedInventoryFormData>({
    resolver: zodResolver(feedInventorySchema),
    defaultValues: {
      name: "",
      feedType: "starter",
      quantity: 0,
      unit: "kg",
      costPerUnit: 0,
      minStock: 0,
      maxStock: 0,
    },
  });

  const onSubmit = (data: FeedInventoryFormData) => {
    if (editingItem) {
      // Update existing item
      setInventory(prev => 
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
        supplier: "Mock Supplier", // This would come from supplier selection
        isActive: true,
      };
      setInventory(prev => [...prev, newItem]);
    }
    
    setIsAddDialogOpen(false);
    setEditingItem(null);
    form.reset();
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    form.reset({
      name: item.name,
      feedType: item.feedType,
      quantity: item.quantity,
      unit: item.unit,
      costPerUnit: item.costPerUnit,
      minStock: item.minStock,
      maxStock: item.maxStock,
      expiryDate: item.expiryDate,
      batchNumber: item.batchNumber,
      notes: item.notes,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setInventory(prev => prev.filter(item => item.id !== id));
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || item.feedType === filterType;
    return matchesSearch && matchesFilter;
  });

  const lowStockItems = inventory.filter(item => 
    item.minStock && item.quantity <= item.minStock
  );

  const columns = [
    {
      accessorKey: "name",
      header: "Feed Name",
    },
    {
      accessorKey: "feedType",
      header: "Type",
      cell: ({ row }: any) => (
        <Badge variant="secondary">
          {feedTypeLabels[row.getValue("feedType")]}
        </Badge>
      ),
    },
    {
      accessorKey: "supplier",
      header: "Supplier",
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }: any) => (
        <span>{row.getValue("quantity")} {row.original.unit}</span>
      ),
    },
    {
      accessorKey: "costPerUnit",
      header: "Cost/Unit",
      cell: ({ row }: any) => (
        <span>${row.getValue("costPerUnit")?.toFixed(2) || "N/A"}</span>
      ),
    },
    {
      accessorKey: "expiryDate",
      header: "Expiry",
      cell: ({ row }: any) => (
        <span>
          {row.getValue("expiryDate") 
            ? new Date(row.getValue("expiryDate")).toLocaleDateString()
            : "N/A"
          }
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        const item = row.original;
        const isLowStock = item.minStock && item.quantity <= item.minStock;
        const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
        
        if (isExpired) {
          return <Badge variant="destructive">Expired</Badge>;
        }
        if (isLowStock) {
          return <Badge variant="outline" className="text-orange-600">Low Stock</Badge>;
        }
        return <Badge variant="default">Good</Badge>;
      },
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
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${inventory.reduce((sum, item) => 
                sum + (item.quantity * (item.costPerUnit || 0)), 0
              ).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventory.filter(item => item.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Feed Inventory</CardTitle>
              <CardDescription>
                Manage your feed inventory, track stock levels, and monitor expiry dates.
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingItem(null);
                  form.reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feed
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Edit Feed Item" : "Add New Feed Item"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingItem 
                      ? "Update the feed item details below."
                      : "Add a new feed item to your inventory."
                    }
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Feed Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter feed name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="feedType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Feed Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select feed type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(feedTypeLabels).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
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
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
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
                      <FormField
                        control={form.control}
                        name="costPerUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cost per Unit</FormLabel>
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="minStock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Stock</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
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
                        name="maxStock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Stock</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="expiryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Date</FormLabel>
                            <FormControl>
                              <Input 
                                type="date"
                                {...field}
                                value={field.value ? field.value.toISOString().split('T')[0] : ''}
                                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="batchNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Batch Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter batch number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Additional notes about this feed item..."
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
                        {editingItem ? "Update" : "Add"} Feed Item
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
                placeholder="Search feeds..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(feedTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DataTable columns={columns} data={filteredInventory} />
        </CardContent>
      </Card>
    </div>
  );
}
