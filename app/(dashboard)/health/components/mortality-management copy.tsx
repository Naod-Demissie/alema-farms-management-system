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
  Plus, 
  Search, 
  Filter, 
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  CalendarDays,
  FileText,
  AlertTriangle,
  Activity
} from "lucide-react";
import { MortalityTable } from "./mortality-table";
import { mortalityColumns } from "./mortality-columns";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { getFlocks } from "@/server/flocks";
import { getStaff } from "@/server/staff";

// Mock data - replace with actual API calls
const mockMortalityRecords = [
  {
    id: "1",
    flockId: "1",
    date: "2024-01-25",
    count: 2,
    cause: "disease",
    causeDescription: "Respiratory infection - suspected IB",
    recordedBy: "Dr. Sarah Johnson",
    flock: {
      id: "1",
      batchCode: "BR2401001",
      arrivalDate: "2023-12-10"
    }
  },
  {
    id: "2",
    flockId: "2",
    date: "2024-01-24",
    count: 1,
    cause: "injury",
    causeDescription: "Broken leg from equipment accident",
    recordedBy: "Dr. Mike Chen",
    flock: {
      id: "2",
      batchCode: "BR2401002",
      arrivalDate: "2023-12-15"
    }
  },
  {
    id: "3",
    flockId: "3",
    date: "2024-01-23",
    count: 3,
    cause: "environmental",
    causeDescription: "Heat stress during power outage",
    recordedBy: "Dr. Sarah Johnson",
    flock: {
      id: "3",
      batchCode: "BR2401003",
      arrivalDate: "2023-12-20"
    }
  },
  {
    id: "4",
    flockId: "1",
    date: "2024-01-22",
    count: 1,
    cause: "unknown",
    causeDescription: "Sudden death, no obvious cause",
    recordedBy: "Dr. Mike Chen",
    flock: {
      id: "1",
      batchCode: "BR2401001",
      arrivalDate: "2023-12-10"
    }
  }
];

export function MortalityManagement() {
  const [mortalityRecords, setMortalityRecords] = useState(mockMortalityRecords);
  const [flocks, setFlocks] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [causeFilter, setCauseFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | null;
    record: any | null;
  }>({
    open: false,
    type: null,
    record: null,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    flockId: "",
    date: new Date(),
    count: "",
    cause: "",
    causeDescription: "",
    recordedBy: ""
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchFlocks();
    fetchStaff();
  }, []);

  const fetchFlocks = async () => {
    try {
      const result = await getFlocks({}, { page: 1, limit: 100 });
      if (result && result.success && result.data) {
        setFlocks(result.data);
      }
    } catch (error) {
      console.error("Error fetching flocks:", error);
    }
  };

  const fetchStaff = async () => {
    try {
      const result = await getStaff();
      if (result && result.success && result.data) {
        setStaff(result.data);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  const handleInputChange = (field: string, value: string | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedFlock = flocks.find(flock => flock.id === formData.flockId);
    const newRecord = {
      id: Date.now().toString(),
      ...formData,
      date: formData.date instanceof Date ? formData.date.toISOString().split('T')[0] : formData.date,
      count: parseInt(formData.count),
      flock: selectedFlock // Include flock data for age calculation
    };
    
    setMortalityRecords(prev => [newRecord, ...prev]);
    toast.success("Mortality record created successfully!", {
      description: `Record for ${formData.count} deaths has been added`,
    });
    setIsAddDialogOpen(false);
    setFormData({
      flockId: "",
      date: new Date(),
      count: "",
      cause: "",
      causeDescription: "",
      recordedBy: ""
    });
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setFormData({
      flockId: record.flockId,
      date: new Date(record.date),
      count: record.count.toString(),
      cause: record.cause,
      causeDescription: record.causeDescription,
      recordedBy: record.recordedBy
    });
    setIsAddDialogOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedFlock = flocks.find(flock => flock.id === formData.flockId);
    setMortalityRecords(prev => 
      prev.map(r => 
        r.id === editingRecord?.id 
          ? { 
              ...r, 
              ...formData,
              date: formData.date instanceof Date ? formData.date.toISOString().split('T')[0] : formData.date,
              count: parseInt(formData.count),
              flock: selectedFlock // Include flock data for age calculation
            }
          : r
      )
    );
    toast.success("Mortality record updated successfully!", {
      description: `Record for ${formData.count} deaths has been updated`,
    });
    setIsAddDialogOpen(false);
    setEditingRecord(null);
    setFormData({
      flockId: "",
      date: new Date(),
      count: "",
      cause: "",
      causeDescription: "",
      recordedBy: ""
    });
  };

  const handleDeleteClick = (record: any) => {
    setConfirmDialog({
      open: true,
      type: 'delete',
      record: record,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.type) return;

    if (confirmDialog.type === 'delete' && confirmDialog.record) {
      await executeDeleteRecord(confirmDialog.record);
    }

    setConfirmDialog({
      open: false,
      type: null,
      record: null,
    });
  };

  const executeDeleteRecord = async (record: any) => {
    setActionLoading(record.id);
    try {
      setMortalityRecords(prev => prev.filter(r => r.id !== record.id));
      toast.success("Mortality record deleted successfully!", {
        description: `Record for ${record.count} deaths has been removed`,
      });
    } catch (error) {
      console.error("Error deleting mortality record:", error);
      toast.error("Failed to delete mortality record", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRecords = mortalityRecords.filter(record => {
    const matchesSearch = record.flockId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.causeDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.recordedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCause = causeFilter === "all" || record.cause === causeFilter;
    return matchesSearch && matchesCause;
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
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl w-[95vw] max-h-[85vh]">
              <DialogHeader>
                <DialogTitle>
                  {editingRecord ? "Edit Mortality Record" : "Add New Mortality Record"}
                </DialogTitle>
                <DialogDescription>
                  Record mortality details including cause and description.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={editingRecord ? handleUpdate : handleSubmit} className="space-y-4">
                {/* Row 1: Flock ID, Date, and Number of Deaths */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="flockId" className="flex items-center gap-1">
                      Flock ID <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.flockId} onValueChange={(value) => handleInputChange("flockId", value)}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select flock" />
                      </SelectTrigger>
                      <SelectContent>
                        {flocks.map((flock: any) => (
                          <SelectItem key={flock.id} value={flock.id}>
                            {flock.batchCode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="date" className="flex items-center gap-1">
                      Date <span className="text-red-500">*</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal h-10",
                            !formData.date && "text-muted-foreground"
                          )}
                        >
                          {formData.date ? (
                            format(formData.date, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.date}
                          onSelect={(date) => handleInputChange("date", date || new Date())}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="count" className="flex items-center gap-1 whitespace-nowrap">
                      Number of Deaths <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="count"
                      type="number"
                      value={formData.count}
                      onChange={(e) => handleInputChange("count", e.target.value)}
                      placeholder="1"
                      className="h-10"
                      required
                    />
                  </div>
                </div>

                {/* Row 2: Recorded By and Cause of Death - Full Width */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="recordedBy" className="flex items-center gap-1">
                      Recorded By <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.recordedBy} onValueChange={(value) => handleInputChange("recordedBy", value)}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.map((person: any) => (
                          <SelectItem key={person.id} value={person.name}>
                            {person.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="cause" className="flex items-center gap-1">
                      Cause of Death <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.cause} onValueChange={(value) => handleInputChange("cause", value)}>
                      <SelectTrigger className="h-10">
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
                </div>

                {/* Row 3: Cause Description */}
                <div className="space-y-2">
                  <Label htmlFor="causeDescription" className="flex items-center gap-1">
                    Cause Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="causeDescription"
                    value={formData.causeDescription}
                    onChange={(e) => handleInputChange("causeDescription", e.target.value)}
                    placeholder="Detailed description of the cause of death..."
                    rows={3}
                    className="resize-none min-h-[80px]"
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
            <Activity className="h-4 w-4 text-muted-foreground" />
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
          <MortalityTable
            columns={mortalityColumns(handleEdit, handleDeleteClick, getCauseBadge)}
            data={filteredRecords}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
          />
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={
          confirmDialog.type === 'delete'
            ? 'Delete Mortality Record'
            : 'Confirm Action'
        }
        desc={
          confirmDialog.type === 'delete'
            ? `Are you sure you want to delete the mortality record for ${confirmDialog.record?.count} deaths? This action cannot be undone and the record will be permanently removed.`
            : 'Are you sure you want to proceed?'
        }
        confirmText={
          confirmDialog.type === 'delete'
            ? 'Delete Mortality Record'
            : 'Continue'
        }
        cancelBtnText="Cancel"
        destructive={confirmDialog.type === 'delete'}
        handleConfirm={handleConfirmAction}
        isLoading={actionLoading === confirmDialog.record?.id}
      />
    </div>
  );
}
