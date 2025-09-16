"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Edit, Trash2, Eye, Calendar, Egg, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { EGG_GRADES, FERTILITY_OPTIONS, ProductionFilters } from "./production-types";
import { ProductionForm } from "./production-form";
import { getEggProduction, deleteEggProduction } from "@/server/production";
import { toast } from "sonner";

interface EggProduction {
  id: string;
  flockId: string;
  date: Date;
  quantity: number;
  grade: 'A' | 'B' | 'C' | 'cracked' | 'discard';
  fertility?: 'fertile' | 'infertile';
  createdAt: Date;
  updatedAt: Date;
  flock?: {
    id: string;
    batchCode: string;
    breed: string;
    currentCount: number;
  };
}

interface ProductionTableProps {
  filters: ProductionFilters;
  onProductionUpdated: () => void;
  onProductionDeleted: () => void;
}

export function ProductionTable({
  filters,
  onProductionUpdated,
  onProductionDeleted
}: ProductionTableProps) {
  const [productions, setProductions] = useState<EggProduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduction, setSelectedProduction] = useState<EggProduction | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchProductions = async () => {
    setLoading(true);
    try {
      const result = await getEggProduction(filters, {
        page: pagination.page,
        limit: pagination.limit
      });

      if (result.success && result.data) {
        setProductions(result.data);
        if (result.pagination) {
          setPagination(prev => ({
            ...prev,
            ...result.pagination!
          }));
        }
      } else {
        toast.error(result.message || "Failed to fetch production records");
      }
    } catch (error) {
      console.error("Error fetching productions:", error);
      toast.error("An error occurred while fetching production records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductions();
  }, [filters, pagination.page, pagination.limit]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this production record?")) {
      return;
    }

    try {
      const result = await deleteEggProduction(id);
      if (result.success) {
        toast.success("Production record deleted successfully");
        onProductionDeleted();
        fetchProductions();
      } else {
        toast.error(result.message || "Failed to delete production record");
      }
    } catch (error) {
      console.error("Error deleting production:", error);
      toast.error("An error occurred while deleting the production record");
    }
  };

  const handleEdit = (production: EggProduction) => {
    setSelectedProduction(production);
    setIsEditOpen(true);
  };

  const handleView = (production: EggProduction) => {
    setSelectedProduction(production);
    setIsViewOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditOpen(false);
    setSelectedProduction(null);
    onProductionUpdated();
    fetchProductions();
  };

  const getGradeBadge = (grade: string) => {
    const gradeInfo = EGG_GRADES.find(g => g.value === grade);
    return (
      <Badge className={gradeInfo?.color || "bg-gray-100 text-gray-800"}>
        {gradeInfo?.label || grade}
      </Badge>
    );
  };

  const getFertilityBadge = (fertility?: string) => {
    if (!fertility) return null;
    const fertilityInfo = FERTILITY_OPTIONS.find(f => f.value === fertility);
    return (
      <Badge variant="outline" className={fertilityInfo?.color || "bg-gray-100 text-gray-800"}>
        {fertilityInfo?.label || fertility}
      </Badge>
    );
  };

  const getQualityScore = (production: EggProduction) => {
    const gradeScores = {
      'A': 100,
      'B': 80,
      'C': 60,
      'cracked': 20,
      'discard': 0
    };
    return gradeScores[production.grade] || 0;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Egg className="h-4 w-4" />
            Production Records
          </CardTitle>
          <CardDescription>
            Daily egg collection records with quality grading
          </CardDescription>
        </CardHeader>
        <CardContent>
          {productions.length === 0 ? (
            <div className="text-center py-8">
              <Egg className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Production Records</h3>
              <p className="text-muted-foreground">
                No production records found matching your filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Flock</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Fertility</TableHead>
                    <TableHead>Quality Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productions.map((production) => (
                    <TableRow key={production.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(production.date), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{production.flock?.batchCode}</div>
                          <div className="text-sm text-muted-foreground">
                            {production.flock?.breed.replace('_', ' ')} • {production.flock?.currentCount} birds
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          {production.quantity.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getGradeBadge(production.grade)}
                      </TableCell>
                      <TableCell>
                        {getFertilityBadge(production.fertility)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">
                            {getQualityScore(production)}%
                          </div>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${getQualityScore(production)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(production)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(production)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(production.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} results
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Production Record</DialogTitle>
            <DialogDescription>
              Update the egg production record details
            </DialogDescription>
          </DialogHeader>
          {selectedProduction && (
            <ProductionForm
              flocks={[]} // This would be passed from parent
              initialData={{
                flockId: selectedProduction.flockId,
                date: format(new Date(selectedProduction.date), "yyyy-MM-dd"),
                quantity: selectedProduction.quantity,
                grade: selectedProduction.grade,
                fertility: selectedProduction.fertility,
                notes: ""
              }}
              onSuccess={handleEditSuccess}
              onCancel={() => setIsEditOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Production Record Details</DialogTitle>
            <DialogDescription>
              View detailed information about this production record
            </DialogDescription>
          </DialogHeader>
          {selectedProduction && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedProduction.date), "PPP")}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Flock</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedProduction.flock?.batchCode} ({selectedProduction.flock?.breed})
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Quantity</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedProduction.quantity.toLocaleString()} eggs
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Grade</Label>
                  <div className="mt-1">
                    {getGradeBadge(selectedProduction.grade)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Fertility</Label>
                  <div className="mt-1">
                    {getFertilityBadge(selectedProduction.fertility) || (
                      <span className="text-sm text-muted-foreground">Not specified</span>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Quality Score</Label>
                  <p className="text-sm text-muted-foreground">
                    {getQualityScore(selectedProduction)}%
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedProduction.createdAt), "PPP 'at' p")}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Last Updated</Label>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedProduction.updatedAt), "PPP 'at' p")}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
