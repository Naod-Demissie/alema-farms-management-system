"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  createFlock, 
  updateFlock, 
  deleteFlock, 
  getFlocks,
  generateBatchCode,
  FlockFilters,
  PaginationParams,
  SortParams
} from "@/server/flocks";
import { Flock, FlockFormData, BREED_OPTIONS, SOURCE_OPTIONS } from "./flock-types";
import { format } from "date-fns";

const flockSchema = z.object({
  batchCode: z.string().min(1, "Batch code is required"),
  breed: z.enum(['broiler', 'layer', 'dual_purpose']),
  source: z.enum(['hatchery', 'farm', 'imported']),
  arrivalDate: z.date(),
  initialCount: z.number().min(1, "Initial count must be at least 1"),
  currentCount: z.number().min(0, "Current count cannot be negative"),
  notes: z.string().optional(),
}).refine((data) => data.currentCount <= data.initialCount, {
  message: "Current count cannot exceed initial count",
  path: ["currentCount"],
});

interface FlockManagementProps {
  flocks: Flock[];
  onFlockCreated: (flock: Flock) => void;
  onFlockUpdated: (flock: Flock) => void;
  onFlockDeleted: (flockId: string) => void;
  onRefresh: () => void;
}

export function FlockManagement({
  flocks,
  onFlockCreated,
  onFlockUpdated,
  onFlockDeleted,
  onRefresh
}: FlockManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFlock, setEditingFlock] = useState<Flock | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [breedFilter, setBreedFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const form = useForm<FlockFormData>({
    resolver: zodResolver(flockSchema),
    defaultValues: {
      batchCode: "",
      breed: "broiler",
      source: "hatchery",
      arrivalDate: new Date(),
      initialCount: 0,
      currentCount: 0,
      notes: "",
    },
  });

  const filteredFlocks = flocks.filter(flock => {
    const matchesSearch = !searchTerm || 
      flock.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flock.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flock.source.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBreed = !breedFilter || breedFilter === "all" || flock.breed === breedFilter;
    const matchesSource = !sourceFilter || sourceFilter === "all" || flock.source === sourceFilter;
    
    return matchesSearch && matchesBreed && matchesSource;
  });

  const handleCreateFlock = async (data: FlockFormData) => {
    try {
      setLoading(true);
      const result = await createFlock(data);
      
      if (result.success) {
        onFlockCreated(result.data);
        form.reset();
        setIsCreateDialogOpen(false);
      } else {
        // Handle error - you might want to show a toast notification
        console.error('Error creating flock:', result.message);
      }
    } catch (error) {
      console.error('Error creating flock:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditFlock = async (data: FlockFormData) => {
    if (!editingFlock) return;
    
    try {
      setLoading(true);
      const result = await updateFlock(editingFlock.id, data);
      
      if (result.success) {
        onFlockUpdated(result.data);
        form.reset();
        setIsEditDialogOpen(false);
        setEditingFlock(null);
      } else {
        console.error('Error updating flock:', result.message);
      }
    } catch (error) {
      console.error('Error updating flock:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFlock = async (flockId: string) => {
    try {
      setDeletingId(flockId);
      const result = await deleteFlock(flockId);
      
      if (result.success) {
        onFlockDeleted(flockId);
      } else {
        console.error('Error deleting flock:', result.message);
      }
    } catch (error) {
      console.error('Error deleting flock:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (flock: Flock) => {
    setEditingFlock(flock);
    form.reset({
      batchCode: flock.batchCode,
      breed: flock.breed,
      source: flock.source,
      arrivalDate: new Date(flock.arrivalDate),
      initialCount: flock.initialCount,
      currentCount: flock.currentCount,
      notes: "",
    });
    setIsEditDialogOpen(true);
  };

  const handleGenerateBatchCode = async (breed: string) => {
    try {
      const result = await generateBatchCode(breed as any);
      if (result.success) {
        form.setValue('batchCode', result.data.batchCode);
      }
    } catch (error) {
      console.error('Error generating batch code:', error);
    }
  };

  const getBreedLabel = (breed: string) => {
    return BREED_OPTIONS.find(option => option.value === breed)?.label || breed;
  };

  const getSourceLabel = (source: string) => {
    return SOURCE_OPTIONS.find(option => option.value === source)?.label || source;
  };

  const getBreedBadgeVariant = (breed: string) => {
    switch (breed) {
      case 'broiler': return 'default';
      case 'layer': return 'secondary';
      case 'dual_purpose': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Flock Management</h2>
          <p className="text-muted-foreground">
            Manage your poultry flocks and track their performance
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Flock
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Flock</DialogTitle>
              <DialogDescription>
                Create a new flock with unique batch code and tracking information
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateFlock)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="batchCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch Code</FormLabel>
                        <div className="flex space-x-2">
                          <FormControl>
                            <Input placeholder="e.g., BR2401001" {...field} />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateBatchCode(form.getValues('breed'))}
                          >
                            Generate
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="breed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Breed Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select breed" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {BREED_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div>
                                  <div className="font-medium">{option.label}</div>
                                  <div className="text-sm text-muted-foreground">{option.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SOURCE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div>
                                  <div className="font-medium">{option.label}</div>
                                  <div className="text-sm text-muted-foreground">{option.description}</div>
                                </div>
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
                    name="arrivalDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Arrival Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
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
                    name="initialCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Count</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currentCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Count</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Flock
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search flocks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={breedFilter} onValueChange={setBreedFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by breed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Breeds</SelectItem>
                {BREED_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {SOURCE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setBreedFilter("all");
                setSourceFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Flocks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Flocks ({filteredFlocks.length})</CardTitle>
          <CardDescription>
            Manage and track your poultry flocks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch Code</TableHead>
                <TableHead>Breed</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Arrival Date</TableHead>
                <TableHead>Initial Count</TableHead>
                <TableHead>Current Count</TableHead>
                <TableHead>Mortality Rate</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFlocks.map((flock) => {
                const mortalityRate = ((flock.initialCount - flock.currentCount) / flock.initialCount) * 100;
                return (
                  <TableRow key={flock.id}>
                    <TableCell className="font-medium">{flock.batchCode}</TableCell>
                    <TableCell>
                      <Badge variant={getBreedBadgeVariant(flock.breed)}>
                        {getBreedLabel(flock.breed)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getSourceLabel(flock.source)}</TableCell>
                    <TableCell>{format(new Date(flock.arrivalDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{flock.initialCount.toLocaleString()}</TableCell>
                    <TableCell>{flock.currentCount.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={mortalityRate > 10 ? 'text-red-600' : 'text-green-600'}>
                        {mortalityRate.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(flock)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteFlock(flock.id)}
                            disabled={deletingId === flock.id}
                            className="text-red-600"
                          >
                            {deletingId === flock.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Flock</DialogTitle>
            <DialogDescription>
              Update flock information and tracking details
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditFlock)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="batchCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., BR2401001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="breed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Breed Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select breed" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BREED_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-sm text-muted-foreground">{option.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SOURCE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-sm text-muted-foreground">{option.description}</div>
                              </div>
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
                  name="arrivalDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arrival Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
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
                  name="initialCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Count</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currentCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Count</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingFlock(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Update Flock
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
