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
  Weight,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { monitoringColumns } from "./monitoring-columns";

// Mock data - replace with actual API calls
const mockHealthMonitoring = [
  {
    id: "1",
    flockId: "Flock A-001",
    date: "2024-01-25",
    avgWeight: 2.1,
    bodyCondition: "normal",
    behavior: "active",
    observations: "All birds appear healthy, good feed consumption, normal activity levels",
    recordedBy: "Dr. Sarah Johnson",
    temperature: 40.5,
    humidity: 65,
    feedConsumption: 150,
    waterConsumption: 200,
    mortalityCount: 0,
    status: "healthy"
  },
  {
    id: "2",
    flockId: "Flock B-002",
    date: "2024-01-25",
    avgWeight: 1.8,
    bodyCondition: "underweight",
    behavior: "lethargic",
    observations: "Some birds showing signs of lethargy, reduced feed intake observed",
    recordedBy: "Dr. Mike Chen",
    temperature: 41.2,
    humidity: 70,
    feedConsumption: 120,
    waterConsumption: 180,
    mortalityCount: 2,
    status: "alert"
  },
  {
    id: "3",
    flockId: "Flock C-003",
    date: "2024-01-24",
    avgWeight: 2.3,
    bodyCondition: "normal",
    behavior: "active",
    observations: "Excellent condition, all birds active and healthy",
    recordedBy: "Dr. Sarah Johnson",
    temperature: 40.0,
    humidity: 60,
    feedConsumption: 160,
    waterConsumption: 220,
    mortalityCount: 0,
    status: "healthy"
  },
  {
    id: "4",
    flockId: "Flock A-001",
    date: "2024-01-23",
    avgWeight: 2.0,
    bodyCondition: "normal",
    behavior: "abnormal",
    observations: "Some birds showing abnormal behavior patterns, investigating further",
    recordedBy: "Dr. Mike Chen",
    temperature: 40.8,
    humidity: 68,
    feedConsumption: 140,
    waterConsumption: 190,
    mortalityCount: 1,
    status: "warning"
  }
];

export function HealthMonitoring() {
  const [monitoringRecords, setMonitoringRecords] = useState(mockHealthMonitoring);
  const [searchTerm, setSearchTerm] = useState("");
  const [flockFilter, setFlockFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    flockId: "",
    date: "",
    avgWeight: "",
    bodyCondition: "",
    behavior: "",
    observations: "",
    recordedBy: "",
    temperature: "",
    humidity: "",
    feedConsumption: "",
    waterConsumption: "",
    mortalityCount: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord = {
      id: Date.now().toString(),
      ...formData,
      avgWeight: parseFloat(formData.avgWeight),
      temperature: parseFloat(formData.temperature),
      humidity: parseFloat(formData.humidity),
      feedConsumption: parseFloat(formData.feedConsumption),
      waterConsumption: parseFloat(formData.waterConsumption),
      mortalityCount: parseInt(formData.mortalityCount),
      status: "healthy"
    };
    
    setMonitoringRecords(prev => [newRecord, ...prev]);
    setIsAddDialogOpen(false);
    setFormData({
      flockId: "",
      date: "",
      avgWeight: "",
      bodyCondition: "",
      behavior: "",
      observations: "",
      recordedBy: "",
      temperature: "",
      humidity: "",
      feedConsumption: "",
      waterConsumption: "",
      mortalityCount: ""
    });
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setFormData({
      flockId: record.flockId,
      date: record.date,
      avgWeight: record.avgWeight.toString(),
      bodyCondition: record.bodyCondition,
      behavior: record.behavior,
      observations: record.observations,
      recordedBy: record.recordedBy,
      temperature: record.temperature.toString(),
      humidity: record.humidity.toString(),
      feedConsumption: record.feedConsumption.toString(),
      waterConsumption: record.waterConsumption.toString(),
      mortalityCount: record.mortalityCount.toString()
    });
    setIsAddDialogOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setMonitoringRecords(prev => 
      prev.map(r => 
        r.id === editingRecord?.id 
          ? { 
              ...r, 
              ...formData,
              avgWeight: parseFloat(formData.avgWeight),
              temperature: parseFloat(formData.temperature),
              humidity: parseFloat(formData.humidity),
              feedConsumption: parseFloat(formData.feedConsumption),
              waterConsumption: parseFloat(formData.waterConsumption),
              mortalityCount: parseInt(formData.mortalityCount)
            }
          : r
      )
    );
    setIsAddDialogOpen(false);
    setEditingRecord(null);
    setFormData({
      flockId: "",
      date: "",
      avgWeight: "",
      bodyCondition: "",
      behavior: "",
      observations: "",
      recordedBy: "",
      temperature: "",
      humidity: "",
      feedConsumption: "",
      waterConsumption: "",
      mortalityCount: ""
    });
  };

  const handleDelete = (id: string) => {
    setMonitoringRecords(prev => prev.filter(r => r.id !== id));
  };

  const filteredRecords = monitoringRecords.filter(record => {
    const matchesSearch = record.flockId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.observations.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.recordedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFlock = flockFilter === "all" || record.flockId === flockFilter;
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    return matchesSearch && matchesFlock && matchesStatus;
  });

  const getBodyConditionBadge = (condition: string) => {
    switch (condition) {
      case "underweight":
        return <Badge variant="outline" className="border-red-200 text-red-800"><TrendingDown className="w-3 h-3 mr-1" />Underweight</Badge>;
      case "normal":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Normal</Badge>;
      case "overweight":
        return <Badge variant="outline" className="border-yellow-200 text-yellow-800"><TrendingUp className="w-3 h-3 mr-1" />Overweight</Badge>;
      default:
        return <Badge variant="secondary">{condition}</Badge>;
    }
  };

  const getBehaviorBadge = (behavior: string) => {
    switch (behavior) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800"><Activity className="w-3 h-3 mr-1" />Active</Badge>;
      case "lethargic":
        return <Badge variant="outline" className="border-yellow-200 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Lethargic</Badge>;
      case "abnormal":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Abnormal</Badge>;
      default:
        return <Badge variant="secondary">{behavior}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Healthy</Badge>;
      case "warning":
        return <Badge variant="outline" className="border-yellow-200 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Warning</Badge>;
      case "alert":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Alert</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Health Monitoring</h2>
          <p className="text-muted-foreground">
            Track weight, body condition, behavior, and health observations
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
                  {editingRecord ? "Edit Health Monitoring Record" : "Add New Health Monitoring Record"}
                </DialogTitle>
                <DialogDescription>
                  Record health monitoring data including weight, body condition, and behavior observations.
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
                    <Label htmlFor="avgWeight">Average Weight (kg) *</Label>
                    <Input
                      id="avgWeight"
                      type="number"
                      step="0.1"
                      value={formData.avgWeight}
                      onChange={(e) => handleInputChange("avgWeight", e.target.value)}
                      placeholder="2.1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bodyCondition">Body Condition *</Label>
                    <Select value={formData.bodyCondition} onValueChange={(value) => handleInputChange("bodyCondition", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="underweight">Underweight</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="overweight">Overweight</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="behavior">Behavior *</Label>
                    <Select value={formData.behavior} onValueChange={(value) => handleInputChange("behavior", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select behavior" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="lethargic">Lethargic</SelectItem>
                        <SelectItem value="abnormal">Abnormal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature (°C)</Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      value={formData.temperature}
                      onChange={(e) => handleInputChange("temperature", e.target.value)}
                      placeholder="40.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="humidity">Humidity (%)</Label>
                    <Input
                      id="humidity"
                      type="number"
                      value={formData.humidity}
                      onChange={(e) => handleInputChange("humidity", e.target.value)}
                      placeholder="65"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mortalityCount">Mortality Count</Label>
                    <Input
                      id="mortalityCount"
                      type="number"
                      value={formData.mortalityCount}
                      onChange={(e) => handleInputChange("mortalityCount", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="feedConsumption">Feed Consumption (kg)</Label>
                    <Input
                      id="feedConsumption"
                      type="number"
                      step="0.1"
                      value={formData.feedConsumption}
                      onChange={(e) => handleInputChange("feedConsumption", e.target.value)}
                      placeholder="150"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="waterConsumption">Water Consumption (L)</Label>
                    <Input
                      id="waterConsumption"
                      type="number"
                      step="0.1"
                      value={formData.waterConsumption}
                      onChange={(e) => handleInputChange("waterConsumption", e.target.value)}
                      placeholder="200"
                    />
                  </div>
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

                <div className="space-y-2">
                  <Label htmlFor="observations">Health Observations *</Label>
                  <Textarea
                    id="observations"
                    value={formData.observations}
                    onChange={(e) => handleInputChange("observations", e.target.value)}
                    placeholder="Describe health observations, any concerns, or notable behaviors..."
                    rows={3}
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
        <Select value={flockFilter} onValueChange={setFlockFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by flock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Flocks</SelectItem>
            <SelectItem value="Flock A-001">Flock A-001</SelectItem>
            <SelectItem value="Flock B-002">Flock B-002</SelectItem>
            <SelectItem value="Flock C-003">Flock C-003</SelectItem>
            <SelectItem value="Flock D-004">Flock D-004</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="healthy">Healthy</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="alert">Alert</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Health Monitoring Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Health Monitoring Records</CardTitle>
          <CardDescription>
            {filteredRecords.length} monitoring records found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={monitoringColumns(handleEdit, handleDelete, getBodyConditionBadge, getBehaviorBadge, getStatusBadge)}
            data={filteredRecords}
          />
        </CardContent>
      </Card>
    </div>
  );
}
