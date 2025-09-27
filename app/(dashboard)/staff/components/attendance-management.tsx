"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Users,
  UserCheck,
  MoreHorizontal,
  Undo2
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { checkIn, checkOut, getAttendance, getStaffAttendance, deleteAttendance } from "@/server/attendance";
import { getStaff } from "@/server/staff";
import { DataTable } from "@/components/ui/data-table";
import { DataTablePagination } from "@/components/table/data-table-pagination";
import { DataTableToolbar } from "@/components/table/data-table-toolbar";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, Search } from "lucide-react";

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  isActive: boolean;
}

interface AttendanceRecord {
  id: string;
  staffId: string;
  date: string;
  status: string;
  checkIn?: string;
  checkOut?: string;
  hours?: number;
  staff: {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    role: string;
  };
}

interface AttendanceStats {
  totalStaff: number;
  present: number;
  absent: number;
  late: number;
  averageHours: number;
}

const statusColors = {
  Present: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Absent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  Late: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  "On Leave": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "Checked Out": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

// Check-in/out table columns
const createCheckInOutTableColumns = ({
  onCheckIn,
  onCheckOut,
  onUndo,
  attendanceRecords,
}: {
  onCheckIn: (staffId: string) => void;
  onCheckOut: (staffId: string) => void;
  onUndo: (staffId: string) => void;
  attendanceRecords: AttendanceRecord[];
}): ColumnDef<any>[] => [
  {
    accessorKey: "name",
    header: "Staff Name",
    meta: {
      className: "font-medium",
    },
  },
  {
    id: "checkIn",
    header: "Check In Time",
    cell: ({ row }) => {
      const staffId = row.original.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayRecord = attendanceRecords.find(record => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return record.staffId === staffId && recordDate.getTime() === today.getTime();
      });

      return todayRecord?.checkIn ? (
        <div className="flex items-center text-green-600">
          <CheckCircle className="mr-1 h-3 w-3" />
          {new Date(todayRecord.checkIn).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          })}
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    id: "checkOut",
    header: "Check Out Time",
    cell: ({ row }) => {
      const staffId = row.original.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayRecord = attendanceRecords.find(record => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return record.staffId === staffId && recordDate.getTime() === today.getTime();
      });

      return todayRecord?.checkOut ? (
        <div className="flex items-center text-red-600">
          <XCircle className="mr-1 h-3 w-3" />
          {new Date(todayRecord.checkOut).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          })}
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    id: "hours",
    header: "Hours",
    cell: ({ row }) => {
      const staffId = row.original.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayRecord = attendanceRecords.find(record => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return record.staffId === staffId && recordDate.getTime() === today.getTime();
      });

      return todayRecord?.hours && todayRecord.hours > 0 
        ? `${Math.round(todayRecord.hours * 10) / 10}h` 
        : "-";
    },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const staffId = row.original.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayRecord = attendanceRecords.find(record => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return record.staffId === staffId && recordDate.getTime() === today.getTime();
      });

      return (
        <Badge className={statusColors[todayRecord?.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
          {todayRecord?.status || "Not Checked"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const staffId = row.original.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayRecord = attendanceRecords.find(record => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return record.staffId === staffId && recordDate.getTime() === today.getTime();
      });

      const getActionButton = () => {
        if (!todayRecord) {
          return (
            <Button
              size="sm"
              onClick={() => onCheckIn(staffId)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-1 h-3 w-3" />
              Check In
            </Button>
          );
        }

        if (todayRecord.status === 'Present' && !todayRecord.checkOut) {
          return (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCheckOut(staffId)}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <XCircle className="mr-1 h-3 w-3" />
              Check Out
            </Button>
          );
        }

        if (todayRecord.status === 'Checked Out') {
          return (
            <Badge className="bg-purple-100 text-purple-800">
              Completed
            </Badge>
          );
        }

        return (
          <Button
            size="sm"
            onClick={() => onCheckIn(staffId)}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="mr-1 h-3 w-3" />
            Check In
          </Button>
        );
      };

      return (
        <div className="flex items-center gap-2">
          {getActionButton()}
          {todayRecord && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onUndo(staffId)}>
                  <Undo2 className="mr-2 h-4 w-4" />
                  Reset Record
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      );
    },
  },
];

// Attendance records table columns
const attendanceRecordsColumns: ColumnDef<AttendanceRecord>[] = [
  {
    accessorKey: "staff.name",
    header: "Staff Member",
    meta: {
      className: "font-medium",
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      return new Date(row.getValue("date")).toLocaleDateString();
    },
  },
  {
    accessorKey: "checkIn",
    header: "Check In",
    cell: ({ row }) => {
      const checkIn = row.getValue("checkIn") as string;
      return checkIn ? (
        <div className="flex items-center text-green-600">
          <CheckCircle className="mr-1 h-3 w-3" />
          {new Date(checkIn).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          })}
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorKey: "checkOut",
    header: "Check Out",
    cell: ({ row }) => {
      const checkOut = row.getValue("checkOut") as string;
      return checkOut ? (
        <div className="flex items-center text-red-600">
          <XCircle className="mr-1 h-3 w-3" />
          {new Date(checkOut).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          })}
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "hours",
    header: "Hours",
    cell: ({ row }) => {
      const hours = row.getValue("hours") as number;
      return hours && hours > 0 ? `${Math.round(hours * 10) / 10}h` : "-";
    },
  },
];

// Reports table columns
const reportsColumns: ColumnDef<any>[] = [
  {
    accessorKey: "name",
    header: "Staff Member",
    meta: {
      className: "font-medium",
    },
  },
  {
    accessorKey: "weekAttendance",
    header: "This Week",
    cell: ({ row }) => {
      const weekAttendance = row.getValue("weekAttendance") as number;
      const weekPercentage = row.original.weekPercentage;
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">{weekAttendance} days</span>
          <Badge variant="outline" className={weekPercentage >= 80 ? "bg-green-100 text-green-800" : weekPercentage >= 60 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
            {weekPercentage}%
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "monthAttendance",
    header: "This Month",
    cell: ({ row }) => {
      const monthAttendance = row.getValue("monthAttendance") as number;
      const monthPercentage = row.original.monthPercentage;
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">{monthAttendance} days</span>
          <Badge variant="outline" className={monthPercentage >= 80 ? "bg-green-100 text-green-800" : monthPercentage >= 60 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
            {monthPercentage}%
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "yearAttendance",
    header: "This Year",
    cell: ({ row }) => {
      const yearAttendance = row.getValue("yearAttendance") as number;
      const yearPercentage = row.original.yearPercentage;
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">{yearAttendance} days</span>
          <Badge variant="outline" className={yearPercentage >= 80 ? "bg-green-100 text-green-800" : yearPercentage >= 60 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
            {yearPercentage}%
          </Badge>
        </div>
      );
    },
  },
];

export function AttendanceManagement() {
  const [activeTab, setActiveTab] = useState("checkin");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    totalStaff: 0,
    present: 0,
    absent: 0,
    late: 0,
    averageHours: 0
  });
  const [loading, setLoading] = useState(false);
  const [reportsData, setReportsData] = useState<any>(null);
  const [reportsTableData, setReportsTableData] = useState<any[]>([]);

  // Load initial data
  useEffect(() => {
    loadStaffMembers();
    loadAttendanceStats();
    loadTodayAttendanceRecords();
  }, []);

  // Load attendance records when tab or filters change
  useEffect(() => {
    if (activeTab === "records") {
      loadAttendanceRecords();
    } else if (activeTab === "checkin") {
      loadTodayAttendanceRecords();
    }
  }, [activeTab, searchTerm, statusFilter, selectedDate]);

  // Load reports data
  useEffect(() => {
    if (activeTab === "reports") {
      loadReportsData();
    }
  }, [activeTab]);

  const loadStaffMembers = async () => {
    try {
      const result = await getStaff();
      if (result.success && result.data) {
        // Filter only WORKER role staff
        const workers = result.data.filter((staff: any) => staff.role === "WORKER" && staff.isActive);
        setStaffMembers(workers);
      }
    } catch (error) {
      console.error("Error loading staff members:", error);
      toast.error("Failed to load staff members");
    }
  };

  const loadAttendanceStats = async () => {
    try {
      const today = new Date();
      const result = await getAttendance({
        dateRange: {
          start: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
        }
      });

      if (result.success && result.data) {
        const records = result.data;
        const totalStaff = staffMembers.length;
        const present = records.filter((r: any) => r.status === "Present" || r.status === "Checked Out").length;
        const absent = totalStaff - present;
        const totalHours = records.reduce((sum: number, r: any) => sum + (r.hours || 0), 0);
        const averageHours = present > 0 ? totalHours / present : 0;

        setAttendanceStats({
          totalStaff,
          present,
          absent,
          late: 0, // You can implement late logic if needed
          averageHours: Math.round(averageHours * 10) / 10
        });
      }
    } catch (error) {
      console.error("Error loading attendance stats:", error);
    }
  };

  const loadTodayAttendanceRecords = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const result = await getAttendance({
        dateRange: {
          start: startOfDay,
          end: endOfDay
        }
      });
      
      if (result.success && result.data) {
        setAttendanceRecords(result.data);
      }
    } catch (error) {
      console.error("Error loading today's attendance records:", error);
    }
  };

  const loadAttendanceRecords = async () => {
    try {
      setLoading(true);
      const filters: any = {
        limit: 100 // Load more records for better filtering
      };

      if (searchTerm) {
        filters.search = searchTerm;
      }

      if (statusFilter !== "all") {
        filters.status = statusFilter;
      }

      if (selectedDate) {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        filters.dateRange = {
          start: startOfDay,
          end: endOfDay
        };
      }

      const result = await getAttendance(filters);
      if (result.success && result.data) {
        setAttendanceRecords(result.data);
      }
    } catch (error) {
      console.error("Error loading attendance records:", error);
      toast.error("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  const loadReportsData = async () => {
    try {
      // Load attendance data for reports
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const yearStart = new Date(now.getFullYear(), 0, 1);

      const [weekResult, monthResult, yearResult] = await Promise.all([
        getAttendance({
          dateRange: { start: weekStart, end: new Date() }
        }),
        getAttendance({
          dateRange: { start: monthStart, end: new Date() }
        }),
        getAttendance({
          dateRange: { start: yearStart, end: new Date() }
        })
      ]);

      const weekData = weekResult.success ? weekResult.data : [];
      const monthData = monthResult.success ? monthResult.data : [];
      const yearData = yearResult.success ? yearResult.data : [];

      setReportsData({
        week: weekData,
        month: monthData,
        year: yearData
      });

      // Create table data for reports
      const tableData = staffMembers.map(staff => {
        const weekCount = (weekData || []).filter((record: any) => record.staffId === staff.id).length;
        const monthCount = (monthData || []).filter((record: any) => record.staffId === staff.id).length;
        const yearCount = (yearData || []).filter((record: any) => record.staffId === staff.id).length;

        return {
          id: staff.id,
          name: staff.name,
          weekAttendance: weekCount,
          monthAttendance: monthCount,
          yearAttendance: yearCount,
          weekPercentage: Math.round((weekCount / 7) * 100),
          monthPercentage: Math.round((monthCount / 30) * 100),
          yearPercentage: Math.round((yearCount / 365) * 100)
        };
      });

      setReportsTableData(tableData);
    } catch (error) {
      console.error("Error loading reports data:", error);
    }
  };

  const handleCheckIn = async (staffId: string) => {
    try {
      const result = await checkIn(staffId);
      if (result.success) {
        toast.success("Checked in successfully");
        loadAttendanceStats();
        loadTodayAttendanceRecords();
        if (activeTab === "records") {
          loadAttendanceRecords();
        }
      } else {
        toast.error(result.message || "Failed to check in");
      }
    } catch (error) {
      console.error("Error checking in:", error);
      toast.error("Failed to check in");
    }
  };

  const handleCheckOut = async (staffId: string) => {
    try {
      const result = await checkOut(staffId);
      if (result.success) {
        toast.success("Checked out successfully");
        loadAttendanceStats();
        loadTodayAttendanceRecords();
        if (activeTab === "records") {
          loadAttendanceRecords();
        }
      } else {
        toast.error(result.message || "Failed to check out");
      }
    } catch (error) {
      console.error("Error checking out:", error);
      toast.error("Failed to check out");
    }
  };

  const handleUndoAttendance = async (staffId: string) => {
    try {
      // Find today's attendance record
      const today = new Date();
      const result = await getStaffAttendance(staffId, {
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      });

      if (result.success && result.data && result.data.length > 0) {
        const attendanceRecord = result.data[0];
        const deleteResult = await deleteAttendance(attendanceRecord.id);
        
        if (deleteResult.success) {
          toast.success("Attendance record reset");
          loadAttendanceStats();
          loadTodayAttendanceRecords();
          if (activeTab === "records") {
            loadAttendanceRecords();
          }
        } else {
          toast.error(deleteResult.message || "Failed to reset attendance");
        }
      } else {
        toast.error("No attendance record found to reset");
      }
    } catch (error) {
      console.error("Error undoing attendance:", error);
      toast.error("Failed to reset attendance");
    }
  };

  const getStaffAttendanceStatus = (staffId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRecord = attendanceRecords.find(record => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      return record.staffId === staffId && recordDate.getTime() === today.getTime();
    });
    
    if (!todayRecord) return { status: 'not-checked', buttonText: 'Check In', action: 'checkin' };
    
    if (todayRecord.status === 'Present' && !todayRecord.checkOut) {
      return { status: 'checked-in', buttonText: 'Check Out', action: 'checkout' };
    }
    
    if (todayRecord.status === 'Checked Out') {
      return { status: 'completed', buttonText: 'Completed', action: 'completed' };
    }
    
    return { status: 'not-checked', buttonText: 'Check In', action: 'checkin' };
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attendance Management</h2>
          <p className="text-muted-foreground">
            Track staff attendance and manage check-in/check-out for workers.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.totalStaff}</div>
            <p className="text-xs text-muted-foreground">
              Active worker staff members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
            <p className="text-xs text-muted-foreground">
              {attendanceStats.totalStaff > 0 ? Math.round((attendanceStats.present / attendanceStats.totalStaff) * 100) : 0}% attendance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
            <p className="text-xs text-muted-foreground">
              Staff not present
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.averageHours}h</div>
            <p className="text-xs text-muted-foreground">
              Per staff member today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="checkin">Check In/Out</TabsTrigger>
          <TabsTrigger value="records">Attendance Records</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Check In/Out Tab */}
        <TabsContent value="checkin" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Worker Check In/Out</CardTitle>
              <CardDescription>
                Manage daily attendance for all workers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading...</div>
                </div>
              ) : (
                <DataTable
                  columns={createCheckInOutTableColumns({
                    onCheckIn: handleCheckIn,
                    onCheckOut: handleCheckOut,
                    onUndo: handleUndoAttendance,
                    attendanceRecords,
                  })}
                  data={staffMembers}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Records Tab */}
        <TabsContent value="records" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Filter attendance records by staff, status, or date.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by staff name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Present">Present</SelectItem>
                    <SelectItem value="Checked Out">Checked Out</SelectItem>
                    <SelectItem value="Absent">Absent</SelectItem>
                    <SelectItem value="Late">Late</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setSelectedDate(undefined);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                Detailed attendance records for all staff members with filtering and pagination.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading...</div>
                </div>
              ) : (
                <DataTable
                  columns={attendanceRecordsColumns}
                  data={attendanceRecords}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Reports</CardTitle>
              <CardDescription>
                Weekly, monthly, and yearly attendance summary for all workers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportsTableData.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading attendance reports...</div>
                </div>
              ) : (
                <DataTable
                  columns={reportsColumns}
                  data={reportsTableData}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}