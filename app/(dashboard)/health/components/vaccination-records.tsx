"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  Edit,
  Trash2,
  Syringe,
  CalendarDays,
  FileText
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { vaccinationColumns } from "./vaccination-columns";

// Mock data - replace with actual API calls
const mockVaccinations = [
  {
    id: "1",
    vaccineName: "Newcastle Disease Vaccine",
    lotNumber: "ND2024001",
    manufacturer: "VetCorp",
    batchNumber: "BATCH001",
    expiryDate: "2024-12-31",
    flockId: "Flock A-001",
    administeredDate: "2024-01-15",
    administeredBy: "Dr. Sarah Johnson",
    quantity: 500,
    dosage: "0.5ml per bird",
    route: "Subcutaneous",
    status: "completed",
    notes: "All birds vaccinated successfully, no adverse reactions observed"
  },
  {
    id: "2",
    vaccineName: "Infectious Bursal Disease (IBD) Vaccine",
    lotNumber: "IBD2024002",
    manufacturer: "PoultryVax",
    batchNumber: "BATCH002",
    expiryDate: "2024-11-30",
    flockId: "Flock B-002",
    administeredDate: "2024-01-20",
    administeredBy: "Dr. Mike Chen",
    quantity: 300,
    dosage: "0.3ml per bird",
    route: "Intramuscular",
    status: "scheduled",
    notes: "Scheduled for next week, birds are healthy"
  },
  {
    id: "3",
    vaccineName: "Marek's Disease Vaccine",
    lotNumber: "MD2024003",
    manufacturer: "AvianHealth",
    batchNumber: "BATCH003",
    expiryDate: "2025-01-15",
    flockId: "Flock C-003",
    administeredDate: "2024-01-10",
    administeredBy: "Dr. Sarah Johnson",
    quantity: 750,
    dosage: "0.2ml per bird",
    route: "Subcutaneous",
    status: "completed",
    notes: "Vaccination completed, monitoring for any side effects"
  },
  {
    id: "4",
    vaccineName: "Avian Influenza Vaccine",
    lotNumber: "AI2024004",
    manufacturer: "GlobalVet",
    batchNumber: "BATCH004",
    expiryDate: "2024-10-20",
    flockId: "Flock A-001",
    administeredDate: "2024-01-25",
    administeredBy: "Dr. Mike Chen",
    quantity: 500,
    dosage: "0.4ml per bird",
    route: "Intramuscular",
    status: "in_progress",
    notes: "Half completed, continuing tomorrow"
  }
];

export function VaccinationRecords() {
  const [vaccinations, setVaccinations] = useState(mockVaccinations);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVaccination, setEditingVaccination] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    vaccineName: "",
    lotNumber: "",
    manufacturer: "",
    batchNumber: "",
    expiryDate: "",
    flockId: "",
    administeredDate: "",
    administeredBy: "",
    quantity: "",
    dosage: "",
    route: "",
    notes: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newVaccination = {
      id: Date.now().toString(),
      ...formData,
      status: "completed",
      quantity: parseInt(formData.quantity)
    };
    
    setVaccinations(prev => [newVaccination, ...prev]);
    setIsAddDialogOpen(false);
    setFormData({
      vaccineName: "",
      lotNumber: "",
      manufacturer: "",
      batchNumber: "",
      expiryDate: "",
      flockId: "",
      administeredDate: "",
      administeredBy: "",
      quantity: "",
      dosage: "",
      route: "",
      notes: ""
    });
  };

  const handleEdit = (vaccination: any) => {
    setEditingVaccination(vaccination);
    setFormData({
      vaccineName: vaccination.vaccineName,
      lotNumber: vaccination.lotNumber,
      manufacturer: vaccination.manufacturer,
      batchNumber: vaccination.batchNumber,
      expiryDate: vaccination.expiryDate,
      flockId: vaccination.flockId,
      administeredDate: vaccination.administeredDate,
      administeredBy: vaccination.administeredBy,
      quantity: vaccination.quantity.toString(),
      dosage: vaccination.dosage,
      route: vaccination.route,
      notes: vaccination.notes
    });
    setIsAddDialogOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setVaccinations(prev => 
      prev.map(v => 
        v.id === editingVaccination?.id 
          ? { ...v, ...formData, quantity: parseInt(formData.quantity) }
          : v
      )
    );
    setIsAddDialogOpen(false);
    setEditingVaccination(null);
    setFormData({
      vaccineName: "",
      lotNumber: "",
      manufacturer: "",
      batchNumber: "",
      expiryDate: "",
      flockId: "",
      administeredDate: "",
      administeredBy: "",
      quantity: "",
      dosage: "",
      route: "",
      notes: ""
    });
  };

  const handleDelete = (id: string) => {
    setVaccinations(prev => prev.filter(v => v.id !== id));
  };

  const filteredVaccinations = vaccinations.filter(vaccination => {
    const matchesSearch = vaccination.vaccineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vaccination.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vaccination.flockId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || vaccination.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "scheduled":
        return <Badge variant="outline" className="border-yellow-200 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Scheduled</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="border-blue-200 text-blue-800"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vaccination Records</h2>
          <p className="text-muted-foreground">
            Track vaccine administration with lot numbers and detailed records
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Vaccination
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingVaccination ? "Edit Vaccination Record" : "Add New Vaccination Record"}
                </DialogTitle>
                <DialogDescription>
                  Record vaccine administration details including lot numbers and dosage information.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={editingVaccination ? handleUpdate : handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vaccineName">Vaccine Name *</Label>
                    <Input
                      id="vaccineName"
                      value={formData.vaccineName}
                      onChange={(e) => handleInputChange("vaccineName", e.target.value)}
                      placeholder="e.g., Newcastle Disease Vaccine"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lotNumber">Lot Number *</Label>
                    <Input
                      id="lotNumber"
                      value={formData.lotNumber}
                      onChange={(e) => handleInputChange("lotNumber", e.target.value)}
                      placeholder="e.g., ND2024001"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">Manufacturer *</Label>
                    <Input
                      id="manufacturer"
                      value={formData.manufacturer}
                      onChange={(e) => handleInputChange("manufacturer", e.target.value)}
                      placeholder="e.g., VetCorp"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batchNumber">Batch Number *</Label>
                    <Input
                      id="batchNumber"
                      value={formData.batchNumber}
                      onChange={(e) => handleInputChange("batchNumber", e.target.value)}
                      placeholder="e.g., BATCH001"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date *</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => handleInputChange("expiryDate", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flockId">Flock ID *</Label>
                    <Select value={formData.flockId} onValueChange={(value) => handleInputChange("flockId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select flock" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Flock A-001">Flock A-001</SelectItem>
                        <SelectItem value="Flock B-002">Flock B-002</SelectItem>
                        <SelectItem value="Flock C-003">Flock C-003</SelectItem>
                        <SelectItem value="Flock D-004">Flock D-004</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="administeredDate">Administered Date *</Label>
                    <Input
                      id="administeredDate"
                      type="date"
                      value={formData.administeredDate}
                      onChange={(e) => handleInputChange("administeredDate", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="administeredBy">Administered By *</Label>
                    <Input
                      id="administeredBy"
                      value={formData.administeredBy}
                      onChange={(e) => handleInputChange("administeredBy", e.target.value)}
                      placeholder="e.g., Dr. Sarah Johnson"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange("quantity", e.target.value)}
                      placeholder="500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dosage">Dosage *</Label>
                    <Input
                      id="dosage"
                      value={formData.dosage}
                      onChange={(e) => handleInputChange("dosage", e.target.value)}
                      placeholder="e.g., 0.5ml per bird"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="route">Route *</Label>
                    <Select value={formData.route} onValueChange={(value) => handleInputChange("route", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select route" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Subcutaneous">Subcutaneous</SelectItem>
                        <SelectItem value="Intramuscular">Intramuscular</SelectItem>
                        <SelectItem value="Intranasal">Intranasal</SelectItem>
                        <SelectItem value="Oral">Oral</SelectItem>
                        <SelectItem value="Ocular">Ocular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Additional notes about the vaccination..."
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingVaccination ? "Update Record" : "Add Record"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search vaccinations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vaccination Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vaccination Records</CardTitle>
          <CardDescription>
            {filteredVaccinations.length} vaccination records found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={vaccinationColumns(handleEdit, handleDelete, getStatusBadge)}
            data={filteredVaccinations}
          />
        </CardContent>
      </Card>
    </div>
  );
}
