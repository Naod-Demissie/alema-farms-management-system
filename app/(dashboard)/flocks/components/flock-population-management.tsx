"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  Loader2,
  Edit
} from "lucide-react";
import { updateFlockPopulation } from "@/server/flocks";
import { Flock, FlockPopulationUpdate, POPULATION_UPDATE_REASONS } from "./flock-types";
import { format } from "date-fns";

const populationUpdateSchema = z.object({
  newCount: z.number().min(0, "Count cannot be negative"),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional(),
});

interface FlockPopulationManagementProps {
  flocks: Flock[];
  onFlockUpdated: (flock: Flock) => void;
  onRefresh: () => void;
}

export function FlockPopulationManagement({
  flocks,
  onFlockUpdated,
  onRefresh
}: FlockPopulationManagementProps) {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedFlock, setSelectedFlock] = useState<Flock | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<Omit<FlockPopulationUpdate, 'flockId'>>({
    resolver: zodResolver(populationUpdateSchema),
    defaultValues: {
      newCount: 0,
      reason: "",
      notes: "",
    },
  });

  const handleUpdatePopulation = async (data: Omit<FlockPopulationUpdate, 'flockId'>) => {
    if (!selectedFlock) return;
    
    try {
      setLoading(true);
      const result = await updateFlockPopulation({
        flockId: selectedFlock.id,
        ...data
      });
      
      if (result.success) {
        onFlockUpdated(result.data);
        form.reset();
        setIsUpdateDialogOpen(false);
        setSelectedFlock(null);
      } else {
        console.error('Error updating population:', result.message);
      }
    } catch (error) {
      console.error('Error updating population:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClick = (flock: Flock) => {
    setSelectedFlock(flock);
    form.reset({
      newCount: flock.currentCount,
      reason: "",
      notes: "",
    });
    setIsUpdateDialogOpen(true);
  };

  const getMortalityRate = (flock: Flock) => {
    return ((flock.initialCount - flock.currentCount) / flock.initialCount) * 100;
  };

  const getMortalityStatus = (mortalityRate: number) => {
    if (mortalityRate > 15) return { status: 'high', color: 'text-red-600', icon: AlertTriangle };
    if (mortalityRate > 5) return { status: 'medium', color: 'text-yellow-600', icon: TrendingDown };
    return { status: 'low', color: 'text-green-600', icon: TrendingUp };
  };

  const getPopulationChange = (flock: Flock) => {
    const change = flock.currentCount - flock.initialCount;
    const percentage = (change / flock.initialCount) * 100;
    return { change, percentage };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Population Management</h2>
          <p className="text-muted-foreground">
            Track and update flock populations, monitor mortality rates
          </p>
        </div>
      </div>

      {/* Population Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Birds</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {flocks.reduce((sum, flock) => sum + flock.currentCount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all flocks
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Mortality</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {flocks.length > 0 
                ? (flocks.reduce((sum, flock) => sum + getMortalityRate(flock), 0) / flocks.length).toFixed(1)
                : 0
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all flocks
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Flocks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {flocks.filter(flock => getMortalityRate(flock) > 15).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Mortality rate &gt; 15%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy Flocks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {flocks.filter(flock => getMortalityRate(flock) <= 5).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Mortality rate &le; 5%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Flocks Population Table */}
      <Card>
        <CardHeader>
          <CardTitle>Flock Population Status</CardTitle>
          <CardDescription>
            Monitor population changes and mortality rates for each flock
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch Code</TableHead>
                <TableHead>Breed</TableHead>
                <TableHead>Initial Count</TableHead>
                <TableHead>Current Count</TableHead>
                <TableHead>Population Change</TableHead>
                <TableHead>Mortality Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flocks.map((flock) => {
                const mortalityRate = getMortalityRate(flock);
                const mortalityStatus = getMortalityStatus(mortalityRate);
                const populationChange = getPopulationChange(flock);
                const StatusIcon = mortalityStatus.icon;
                
                return (
                  <TableRow key={flock.id}>
                    <TableCell className="font-medium">{flock.batchCode}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {flock.breed.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{flock.initialCount.toLocaleString()}</TableCell>
                    <TableCell>{flock.currentCount.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {populationChange.change > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : populationChange.change < 0 ? (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        ) : null}
                        <span className={populationChange.change > 0 ? 'text-green-600' : populationChange.change < 0 ? 'text-red-600' : ''}>
                          {populationChange.change > 0 ? '+' : ''}{populationChange.change.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">
                          ({populationChange.percentage > 0 ? '+' : ''}{populationChange.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={mortalityStatus.color}>
                        {mortalityRate.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <StatusIcon className={`h-4 w-4 ${mortalityStatus.color}`} />
                        <span className={mortalityStatus.color}>
                          {mortalityStatus.status.toUpperCase()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateClick(flock)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Update
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Update Population Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Flock Population</DialogTitle>
            <DialogDescription>
              Update the current population count for {selectedFlock?.batchCode}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdatePopulation)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Initial Count</label>
                  <div className="text-2xl font-bold text-muted-foreground">
                    {selectedFlock?.initialCount.toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Current Count</label>
                  <div className="text-2xl font-bold">
                    {selectedFlock?.currentCount.toLocaleString()}
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="newCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Count</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max={selectedFlock?.initialCount || 0}
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
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Change</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {POPULATION_UPDATE_REASONS.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {reason}
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional details about the population change..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsUpdateDialogOpen(false);
                    setSelectedFlock(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Update Population
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
