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
  Activity,
  CalendarDays,
  FileText,
  Pill,
  Stethoscope
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { treatmentColumns } from "./treatment-columns";

// Mock data - replace with actual API calls
const mockTreatments = [
  {
    id: "1",
    flockId: "Flock A-001",
    disease: "respiratory",
    diseaseName: "Infectious Bronchitis",
    medication: "Amoxicillin",
    dosage: "10mg/kg body weight",
    frequency: "Twice daily",
    duration: "5 days",
    response: "improved",
    treatedBy: "Dr. Sarah Johnson",
    startDate: "2024-01-15",
    endDate: "2024-01-20",
    status: "completed",
    notes: "Significant improvement in respiratory symptoms after 3 days of treatment",
    symptoms: "Coughing, nasal discharge, difficulty breathing"
  },
  {
    id: "2",
    flockId: "Flock B-002",
    disease: "digestive",
    diseaseName: "Coccidiosis",
    medication: "Sulfadimethoxine",
    dosage: "0.1% in drinking water",
    frequency: "Once daily",
    duration: "7 days",
    response: "no_change",
    treatedBy: "Dr. Mike Chen",
    startDate: "2024-01-18",
    endDate: "2024-01-25",
    status: "in_progress",
    notes: "No improvement observed after 3 days, considering alternative treatment",
    symptoms: "Diarrhea, blood in feces, lethargy"
  },
  {
    id: "3",
    flockId: "Flock C-003",
    disease: "parasitic",
    diseaseName: "External Parasites (Mites)",
    medication: "Ivermectin",
    dosage: "0.2mg/kg body weight",
    frequency: "Single dose",
    duration: "1 day",
    response: "improved",
    treatedBy: "Dr. Sarah Johnson",
    startDate: "2024-01-12",
    endDate: "2024-01-13",
    status: "completed",
    notes: "Complete elimination of mites observed within 48 hours",
    symptoms: "Excessive scratching, feather loss, restlessness"
  },
  {
    id: "4",
    flockId: "Flock A-001",
    disease: "nutritional",
    diseaseName: "Vitamin D Deficiency",
    medication: "Vitamin D3 Supplement",
    dosage: "2000 IU per bird",
    frequency: "Daily",
    duration: "14 days",
    response: "improved",
    treatedBy: "Dr. Mike Chen",
    startDate: "2024-01-10",
    endDate: "2024-01-24",
    status: "completed",
    notes: "Bone strength improved, no more leg weakness observed",
    symptoms: "Leg weakness, soft bones, reduced egg production"
  }
];

export function DiseaseTreatment() {
  const [treatments, setTreatments] = useState(mockTreatments);
  const [searchTerm, setSearchTerm] = useState("");
  const [diseaseFilter, setDiseaseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    flockId: "",
    disease: "",
    diseaseName: "",
    medication: "",
    dosage: "",
    frequency: "",
    duration: "",
    treatedBy: "",
    startDate: "",
    endDate: "",
    notes: "",
    symptoms: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTreatment = {
      id: Date.now().toString(),
      ...formData,
      status: "in_progress",
      response: "no_change"
    };
    
    setTreatments(prev => [newTreatment, ...prev]);
    setIsAddDialogOpen(false);
    setFormData({
      flockId: "",
      disease: "",
      diseaseName: "",
      medication: "",
      dosage: "",
      frequency: "",
      duration: "",
      treatedBy: "",
      startDate: "",
      endDate: "",
      notes: "",
      symptoms: ""
    });
  };

  const handleEdit = (treatment: any) => {
    setEditingTreatment(treatment);
    setFormData({
      flockId: treatment.flockId,
      disease: treatment.disease,
      diseaseName: treatment.diseaseName,
      medication: treatment.medication,
      dosage: treatment.dosage,
      frequency: treatment.frequency,
      duration: treatment.duration,
      treatedBy: treatment.treatedBy,
      startDate: treatment.startDate,
      endDate: treatment.endDate,
      notes: treatment.notes,
      symptoms: treatment.symptoms
    });
    setIsAddDialogOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setTreatments(prev => 
      prev.map(t => 
        t.id === editingTreatment?.id 
          ? { ...t, ...formData }
          : t
      )
    );
    setIsAddDialogOpen(false);
    setEditingTreatment(null);
    setFormData({
      flockId: "",
      disease: "",
      diseaseName: "",
      medication: "",
      dosage: "",
      frequency: "",
      duration: "",
      treatedBy: "",
      startDate: "",
      endDate: "",
      notes: "",
      symptoms: ""
    });
  };

  const handleDelete = (id: string) => {
    setTreatments(prev => prev.filter(t => t.id !== id));
  };

  const handleResponseUpdate = (id: string, response: string) => {
    setTreatments(prev => 
      prev.map(t => 
        t.id === id 
          ? { ...t, response, status: response === "improved" ? "completed" : t.status }
          : t
      )
    );
  };

  const filteredTreatments = treatments.filter(treatment => {
    const matchesSearch = treatment.diseaseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         treatment.medication.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         treatment.flockId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDisease = diseaseFilter === "all" || treatment.disease === diseaseFilter;
    const matchesStatus = statusFilter === "all" || treatment.status === statusFilter;
    return matchesSearch && matchesDisease && matchesStatus;
  });

  const getDiseaseBadge = (disease: string) => {
    const colors = {
      respiratory: "bg-blue-100 text-blue-800",
      digestive: "bg-green-100 text-green-800",
      parasitic: "bg-purple-100 text-purple-800",
      nutritional: "bg-yellow-100 text-yellow-800",
      other: "bg-gray-100 text-gray-800"
    };
    return (
      <Badge className={colors[disease as keyof typeof colors] || colors.other}>
        {disease.charAt(0).toUpperCase() + disease.slice(1)}
      </Badge>
    );
  };

  const getResponseBadge = (response: string) => {
    switch (response) {
      case "improved":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Improved</Badge>;
      case "no_change":
        return <Badge variant="outline" className="border-yellow-200 text-yellow-800"><Clock className="w-3 h-3 mr-1" />No Change</Badge>;
      case "worsened":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Worsened</Badge>;
      default:
        return <Badge variant="secondary">{response}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="border-blue-200 text-blue-800"><Activity className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "scheduled":
        return <Badge variant="outline" className="border-yellow-200 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Scheduled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Disease Treatment</h2>
          <p className="text-muted-foreground">
            Track disease classification, medication, and treatment response monitoring
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
                Add Treatment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTreatment ? "Edit Treatment Record" : "Add New Treatment Record"}
                </DialogTitle>
                <DialogDescription>
                  Record disease treatment details including medication and dosage information.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={editingTreatment ? handleUpdate : handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="disease">Disease Classification *</Label>
                    <Select value={formData.disease} onValueChange={(value) => handleInputChange("disease", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select disease type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="respiratory">Respiratory</SelectItem>
                        <SelectItem value="digestive">Digestive</SelectItem>
                        <SelectItem value="parasitic">Parasitic</SelectItem>
                        <SelectItem value="nutritional">Nutritional</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diseaseName">Disease Name *</Label>
                  <Input
                    id="diseaseName"
                    value={formData.diseaseName}
                    onChange={(e) => handleInputChange("diseaseName", e.target.value)}
                    placeholder="e.g., Infectious Bronchitis"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="symptoms">Symptoms Observed *</Label>
                  <Textarea
                    id="symptoms"
                    value={formData.symptoms}
                    onChange={(e) => handleInputChange("symptoms", e.target.value)}
                    placeholder="Describe the symptoms observed..."
                    rows={2}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="medication">Medication *</Label>
                    <Input
                      id="medication"
                      value={formData.medication}
                      onChange={(e) => handleInputChange("medication", e.target.value)}
                      placeholder="e.g., Amoxicillin"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dosage">Dosage *</Label>
                    <Input
                      id="dosage"
                      value={formData.dosage}
                      onChange={(e) => handleInputChange("dosage", e.target.value)}
                      placeholder="e.g., 10mg/kg body weight"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency *</Label>
                    <Select value={formData.frequency} onValueChange={(value) => handleInputChange("frequency", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Once daily">Once daily</SelectItem>
                        <SelectItem value="Twice daily">Twice daily</SelectItem>
                        <SelectItem value="Three times daily">Three times daily</SelectItem>
                        <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                        <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
                        <SelectItem value="Single dose">Single dose</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration *</Label>
                    <Input
                      id="duration"
                      value={formData.duration}
                      onChange={(e) => handleInputChange("duration", e.target.value)}
                      placeholder="e.g., 5 days"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="treatedBy">Treated By *</Label>
                    <Input
                      id="treatedBy"
                      value={formData.treatedBy}
                      onChange={(e) => handleInputChange("treatedBy", e.target.value)}
                      placeholder="e.g., Dr. Sarah Johnson"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange("startDate", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange("endDate", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Treatment Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Additional notes about the treatment..."
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTreatment ? "Update Treatment" : "Add Treatment"}
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
            placeholder="Search treatments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={diseaseFilter} onValueChange={setDiseaseFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by disease" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Diseases</SelectItem>
            <SelectItem value="respiratory">Respiratory</SelectItem>
            <SelectItem value="digestive">Digestive</SelectItem>
            <SelectItem value="parasitic">Parasitic</SelectItem>
            <SelectItem value="nutritional">Nutritional</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Treatment Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Treatment Records</CardTitle>
          <CardDescription>
            {filteredTreatments.length} treatment records found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={treatmentColumns(handleEdit, handleDelete, getDiseaseBadge, getResponseBadge, getStatusBadge, handleResponseUpdate)}
            data={filteredTreatments}
          />
        </CardContent>
      </Card>
    </div>
  );
}
