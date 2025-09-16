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
  Skull,
  CalendarDays,
  FileText,
  AlertTriangle,
  Activity
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { mortalityColumns } from "./mortality-columns";

// Mock data - replace with actual API calls
const mockMortalityRecords = [
  {
    id: "1",
    flockId: "Flock A-001",
    date: "2024-01-25",
    count: 2,
    cause: "disease",
    causeDescription: "Respiratory infection - suspected IB",
    disposalMethod: "incineration",
    postMortem: "Lungs showed signs of inflammation and fluid accumulation. Trachea had mucus buildup.",
    recordedBy: "Dr. Sarah Johnson",
    age: 45,
    weight: 1.8,
    location: "House 1, Section A",
    symptoms: "Difficulty breathing, nasal discharge, lethargy",
    status: "completed"
  },
  {
    id: "2",
    flockId: "Flock B-002",
    date: "2024-01-24",
    count: 1,
    cause: "injury",
    causeDescription: "Broken leg from equipment accident",
    disposalMethod: "burial",
    postMortem: "Compound fracture of left leg, internal bleeding from bone fragments.",
    recordedBy: "Dr. Mike Chen",
    age: 32,
    weight: 2.1,
    location: "House 2, Section B",
    symptoms: "Unable to stand, visible leg deformity",
    status: "completed"
  },
  {
    id: "3",
    flockId: "Flock C-003",
    date: "2024-01-23",
    count: 3,
    cause: "environmental",
    causeDescription: "Heat stress during power outage",
    disposalMethod: "incineration",
    postMortem: "Signs of heat stress, dehydration, and organ failure.",
    recordedBy: "Dr. Sarah Johnson",
    age: 28,
    weight: 1.9,
    location: "House 3, Section C",
    symptoms: "Panting, weakness, collapse",
    status: "completed"
  },
  {
    id: "4",
    flockId: "Flock A-001",
    date: "2024-01-22",
    count: 1,
    cause: "unknown",
    causeDescription: "Sudden death, no obvious cause",
    disposalMethod: "incineration",
    postMortem: "No obvious external or internal signs of disease or injury. Sent for lab analysis.",
    recordedBy: "Dr. Mike Chen",
    age: 38,
    weight: 2.0,
    location: "House 1, Section A",
    symptoms: "Found dead, no prior symptoms",
    status: "pending_analysis"
  }
];

export function MortalityManagement() {
  const [mortalityRecords, setMortalityRecords] = useState(mockMortalityRecords);
  const [searchTerm, setSearchTerm] = useState("");
  const [causeFilter, setCauseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    flockId: "",
    date: "",
    count: "",
    cause: "",
    causeDescription: "",
    disposalMethod: "",
    postMortem: "",
    recordedBy: "",
    age: "",
    weight: "",
    location: "",
    symptoms: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord = {
      id: Date.now().toString(),
      ...formData,
      count: parseInt(formData.count),
      age: parseInt(formData.age),
      weight: parseFloat(formData.weight),
      status: "completed"
    };
    
    setMortalityRecords(prev => [newRecord, ...prev]);
    setIsAddDialogOpen(false);
    setFormData({
      flockId: "",
      date: "",
      count: "",
      cause: "",
      causeDescription: "",
      disposalMethod: "",
      postMortem: "",
      recordedBy: "",
      age: "",
      weight: "",
      location: "",
      symptoms: ""
    });
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setFormData({
      flockId: record.flockId,
      date: record.date,
      count: record.count.toString(),
      cause: record.cause,
      causeDescription: record.causeDescription,
      disposalMethod: record.disposalMethod,
      postMortem: record.postMortem,
      recordedBy: record.recordedBy,
      age: record.age.toString(),
      weight: record.weight.toString(),
      location: record.location,
      symptoms: record.symptoms
    });
    setIsAddDialogOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setMortalityRecords(prev => 
      prev.map(r => 
        r.id === editingRecord?.id 
          ? { 
              ...r, 
              ...formData,
              count: parseInt(formData.count),
              age: parseInt(formData.age),
              weight: parseFloat(formData.weight)
            }
          : r
      )
    );
    setIsAddDialogOpen(false);
    setEditingRecord(null);
    setFormData({
      flockId: "",
      date: "",
      count: "",
      cause: "",
      causeDescription: "",
      disposalMethod: "",
      postMortem: "",
      recordedBy: "",
      age: "",
      weight: "",
      location: "",
      symptoms: ""
    });
  };

  const handleDelete = (id: string) => {
    setMortalityRecords(prev => prev.filter(r => r.id !== id));
  };

  const filteredRecords = mortalityRecords.filter(record => {
    const matchesSearch = record.flockId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.causeDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.recordedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCause = causeFilter === "all" || record.cause === causeFilter;
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    return matchesSearch && matchesCause && matchesStatus;
  });

  const getCauseBadge = (cause: string) => {
    switch (cause) {
      case "disease":
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Disease</Badge>;
      case "injury":
        return <Badge variant="outline" className="border-orange-200 text-orange-800"><Activity className="w-3 h-3 mr-1" />Injury</Badge>;
      case "environmental":
        return <Badge variant="outline" className="border-blue-200 text-blue-800"><AlertCircle className="w-3 h-3 mr-1" />Environmental</Badge>;
      case "unknown":
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Unknown</Badge>;
      default:
        return <Badge variant="secondary">{cause}</Badge>;
    }
  };

  const getDisposalBadge = (method: string) => {
    switch (method) {
      case "incineration":
        return <Badge variant="outline" className="border-red-200 text-red-800">Incineration</Badge>;
      case "burial":
        return <Badge variant="outline" className="border-green-200 text-green-800">Burial</Badge>;
      case "rendering":
        return <Badge variant="outline" className="border-blue-200 text-blue-800">Rendering</Badge>;
      case "composting":
        return <Badge variant="outline" className="border-yellow-200 text-yellow-800">Composting</Badge>;
      default:
        return <Badge variant="secondary">{method}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "pending_analysis":
        return <Badge variant="outline" className="border-yellow-200 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending Analysis</Badge>;
      case "under_investigation":
        return <Badge variant="outline" className="border-blue-200 text-blue-800"><AlertCircle className="w-3 h-3 mr-1" />Under Investigation</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Calculate mortality statistics
  const totalMortality = mortalityRecords.reduce((sum, record) => sum + record.count, 0);
  const diseaseMortality = mortalityRecords
    .filter(record => record.cause === "disease")
    .reduce((sum, record) => sum + record.count, 0);
  const injuryMortality = mortalityRecords
    .filter(record => record.cause === "injury")
    .reduce((sum, record) => sum + record.count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mortality Management</h2>
          <p className="text-muted-foreground">
            Track death causes, disposal methods, and post-mortem documentation
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
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingRecord ? "Edit Mortality Record" : "Add New Mortality Record"}
                </DialogTitle>
                <DialogDescription>
                  Record mortality details including cause, disposal method, and post-mortem findings.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={editingRecord ? handleUpdate : handleSubmit} className="space-y-4">
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
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="count">Number of Deaths *</Label>
                    <Input
                      id="count"
                      type="number"
                      value={formData.count}
                      onChange={(e) => handleInputChange("count", e.target.value)}
                      placeholder="1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age (days)</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => handleInputChange("age", e.target.value)}
                      placeholder="45"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => handleInputChange("weight", e.target.value)}
                      placeholder="2.1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="e.g., House 1, Section A"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="symptoms">Symptoms Observed</Label>
                  <Textarea
                    id="symptoms"
                    value={formData.symptoms}
                    onChange={(e) => handleInputChange("symptoms", e.target.value)}
                    placeholder="Describe any symptoms observed before death..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cause">Cause of Death *</Label>
                    <Select value={formData.cause} onValueChange={(value) => handleInputChange("cause", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select cause" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="disease">Disease</SelectItem>
                        <SelectItem value="injury">Injury</SelectItem>
                        <SelectItem value="environmental">Environmental</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="disposalMethod">Disposal Method *</Label>
                    <Select value={formData.disposalMethod} onValueChange={(value) => handleInputChange("disposalMethod", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="incineration">Incineration</SelectItem>
                        <SelectItem value="burial">Burial</SelectItem>
                        <SelectItem value="rendering">Rendering</SelectItem>
                        <SelectItem value="composting">Composting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="causeDescription">Cause Description *</Label>
                  <Textarea
                    id="causeDescription"
                    value={formData.causeDescription}
                    onChange={(e) => handleInputChange("causeDescription", e.target.value)}
                    placeholder="Detailed description of the cause of death..."
                    rows={2}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postMortem">Post-Mortem Findings</Label>
                  <Textarea
                    id="postMortem"
                    value={formData.postMortem}
                    onChange={(e) => handleInputChange("postMortem", e.target.value)}
                    placeholder="Detailed post-mortem examination findings..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recordedBy">Recorded By *</Label>
                  <Input
                    id="recordedBy"
                    value={formData.recordedBy}
                    onChange={(e) => handleInputChange("recordedBy", e.target.value)}
                    placeholder="e.g., Dr. Sarah Johnson"
                    required
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingRecord ? "Update Record" : "Add Record"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Mortality Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mortality</CardTitle>
            <Skull className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMortality}</div>
            <p className="text-xs text-muted-foreground">birds this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disease Related</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{diseaseMortality}</div>
            <p className="text-xs text-muted-foreground">
              {totalMortality > 0 ? Math.round((diseaseMortality / totalMortality) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Injury Related</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{injuryMortality}</div>
            <p className="text-xs text-muted-foreground">
              {totalMortality > 0 ? Math.round((injuryMortality / totalMortality) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mortality Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-0.2%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={causeFilter} onValueChange={setCauseFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by cause" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Causes</SelectItem>
            <SelectItem value="disease">Disease</SelectItem>
            <SelectItem value="injury">Injury</SelectItem>
            <SelectItem value="environmental">Environmental</SelectItem>
            <SelectItem value="unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending_analysis">Pending Analysis</SelectItem>
            <SelectItem value="under_investigation">Under Investigation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mortality Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mortality Records</CardTitle>
          <CardDescription>
            {filteredRecords.length} mortality records found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={mortalityColumns(handleEdit, handleDelete, getCauseBadge, getDisposalBadge, getStatusBadge)}
            data={filteredRecords}
          />
        </CardContent>
      </Card>
    </div>
  );
}
