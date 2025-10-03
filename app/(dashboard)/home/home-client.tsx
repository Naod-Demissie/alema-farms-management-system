"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  Users,
  Bird,
  Egg,
  Utensils,
  DollarSign,
  BarChart3,
  Clock,
  AlertTriangle,
  Calendar as CalendarIcon,
  UserPlus,
  Activity,
  Settings,
  Eye,
  Download,
  Bell,
  Zap,
  Target,
  PieChart,
  LineChart,
  Calculator,
  ArrowRight,
  Minus,
  Droplets,
  CheckCircle,
  XCircle,
  UserCheck
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickActionDialog } from "@/components/home/quick-action-dialog";
import { ReusableDialog } from "@/components/ui/reusable-dialog";
import { FlockForm, flockSchema } from "@/components/forms/dialog-forms";
import { FeedUsageDialog } from "@/app/(dashboard)/feed/components/feed-usage-dialog";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState as useStateReact } from "react";
import { toast } from "sonner";
import { InventoryCounts } from "@/server/inventory-alerts";
import { getStaff } from "@/server/staff";
import { checkIn, checkOut, getAttendance, isStaffOnLeave } from "@/server/attendance";
import { getKPIData } from "@/server/kpi-data";
import { createFeedUsageAction } from "@/app/actions/feed-usage";

type DashboardSummary = {
  eggsToday: number;
  expensesToday: number;
  salesToday: number;
  feedLeft: number;
};

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
}

export default function HomeClient({ summary, inventoryCounts }: { summary: DashboardSummary; inventoryCounts: InventoryCounts }) {
  const router = useRouter();
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [selectedQuickAction, setSelectedQuickAction] = useState<string | null>(null);
  const [isFlockDialogOpen, setIsFlockDialogOpen] = useState(false);
  const [isFeedUsageDialogOpen, setIsFeedUsageDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [cardLoadingStates, setCardLoadingStates] = useState({
    production: false,
    expenses: false,
    revenue: false
  });
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [buttonStates, setButtonStates] = useState<Record<string, 'checkin' | 'checkout' | 'checkedout' | 'onleave'>>({});
  const [leaveStatus, setLeaveStatus] = useState<Record<string, boolean>>({});
  const [pageLoading, setPageLoading] = useState(true);
  
  // Time period states for KPI cards
  const [productionPeriod, setProductionPeriod] = useState("today");
  const [expensePeriod, setExpensePeriod] = useState("today");
  const [revenuePeriod, setRevenuePeriod] = useState("today");
  
  // Dynamic data states
  const [dynamicData, setDynamicData] = useState({
    production: summary.eggsToday || 0,
    expenses: summary.expensesToday || 0,
    revenue: summary.salesToday || 0
  });

  // Load staff and attendance data
  useEffect(() => {
    const loadStaffAndAttendance = async () => {
      try {
        setStaffLoading(true);
        setPageLoading(true);
        
        // Load staff members
        const staffResult = await getStaff();
        if (staffResult.success && staffResult.data) {
          setStaff(staffResult.data);
        }

        // Load today's attendance records
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const attendanceResult = await getAttendance({
          dateRange: {
            start: today,
            end: tomorrow
          },
          page: 1,
          limit: 100
        });

        if (attendanceResult.success && attendanceResult.data) {
          setAttendanceRecords(attendanceResult.data);
          
          // Initialize button states and leave status based on existing records and leave status
          const initialButtonStates: Record<string, 'checkin' | 'checkout' | 'checkedout' | 'onleave'> = {};
          const initialLeaveStatus: Record<string, boolean> = {};
          
          // Check leave status for each staff member
          for (const member of staffResult.data || []) {
            const isOnLeave = await isStaffOnLeave(member.id);
            initialLeaveStatus[member.id] = isOnLeave;
            
            if (isOnLeave) {
              initialButtonStates[member.id] = 'onleave';
            } else {
              const todayRecord = attendanceResult.data.find((record: AttendanceRecord) => {
                const recordDate = new Date(record.date);
                recordDate.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return record.staffId === member.id && recordDate.getTime() === today.getTime();
              });
              
              if (todayRecord?.status === 'PRESENT') {
                initialButtonStates[member.id] = 'checkedout';
              } else if (todayRecord?.status === 'CHECKED_IN' && !todayRecord.checkOut) {
                initialButtonStates[member.id] = 'checkout';
              } else {
                initialButtonStates[member.id] = 'checkin';
              }
            }
          }
          
          setButtonStates(initialButtonStates);
          setLeaveStatus(initialLeaveStatus);
        }
      } catch (error) {
        console.error('Error loading staff and attendance:', error);
        toast.error("Failed to load staff and attendance data");
      } finally {
        setStaffLoading(false);
        setPageLoading(false);
      }
    };

    loadStaffAndAttendance();
  }, []);

  // Effect to update data when period changes
  useEffect(() => {
    const updateData = async () => {
      try {
        const [productionResult, expensesResult, revenueResult] = await Promise.all([
          getKPIData(productionPeriod),
          getKPIData(expensePeriod),
          getKPIData(revenuePeriod)
        ]);
        
        setDynamicData({ 
          production: productionResult.success && productionResult.data ? productionResult.data.production : 0, 
          expenses: expensesResult.success && expensesResult.data ? expensesResult.data.expenses : 0, 
          revenue: revenueResult.success && revenueResult.data ? revenueResult.data.revenue : 0
        });
      } catch (error) {
        console.error("Error updating KPI data:", error);
        toast.error("Failed to load data");
      }
    };
    
    updateData();
  }, [productionPeriod, expensePeriod, revenuePeriod]);

  // Time period options for each card type
  const getTimePeriodOptions = (cardType: 'production' | 'expenses' | 'revenue') => {
    const baseLabels = {
      production: 'Production',
      expenses: 'Expenses', 
      revenue: 'Revenue'
    };
    
    return [
      { value: "today", label: `Today's ${baseLabels[cardType]}` },
      { value: "week", label: `This Week's ${baseLabels[cardType]}` },
      { value: "month", label: `This Month's ${baseLabels[cardType]}` },
      { value: "3months", label: `3 Months' ${baseLabels[cardType]}` },
      { value: "6months", label: `6 Months' ${baseLabels[cardType]}` },
      { value: "year", label: `This Year's ${baseLabels[cardType]}` }
    ];
  };

  const getPeriodLabel = (period: string, cardType: 'production' | 'expenses' | 'revenue') => {
    const options = getTimePeriodOptions(cardType);
    const option = options.find(opt => opt.value === period);
    return option ? option.label : `Today's ${cardType === 'production' ? 'Production' : cardType === 'expenses' ? 'Expenses' : 'Revenue'}`;
  };

  // Helper function to get loading state for specific card type
  const getCardLoadingState = (cardType?: string) => {
    if (!cardType) return false;
    return cardLoadingStates[cardType as keyof typeof cardLoadingStates] || false;
  };

  const kpiStats = [
    { 
      title: "Egg Production", 
      value: dynamicData.production.toLocaleString(), 
      icon: Egg, 
      color: "bg-yellow-500",
      hasDropdown: true,
      dropdownValue: productionPeriod,
      onDropdownChange: (value: string) => {
        setCardLoadingStates(prev => ({ ...prev, production: true }));
        setProductionPeriod(value);
        // Simulate loading delay
        setTimeout(() => setCardLoadingStates(prev => ({ ...prev, production: false })), 1000);
      },
      cardType: 'production' as const
    },
    { 
      title: "Expenses", 
      value: `ETB ${dynamicData.expenses.toLocaleString()}`, 
      icon: Minus, 
      color: "bg-rose-500",
      hasDropdown: true,
      dropdownValue: expensePeriod,
      onDropdownChange: (value: string) => {
        setCardLoadingStates(prev => ({ ...prev, expenses: true }));
        setExpensePeriod(value);
        // Simulate loading delay
        setTimeout(() => setCardLoadingStates(prev => ({ ...prev, expenses: false })), 1000);
      },
      cardType: 'expenses' as const
    },
    { 
      title: "Revenue", 
      value: `ETB ${dynamicData.revenue.toLocaleString()}`, 
      icon: DollarSign, 
      color: "bg-purple-500",
      hasDropdown: true,
      dropdownValue: revenuePeriod,
      onDropdownChange: (value: string) => {
        setCardLoadingStates(prev => ({ ...prev, revenue: true }));
        setRevenuePeriod(value);
        // Simulate loading delay
        setTimeout(() => setCardLoadingStates(prev => ({ ...prev, revenue: false })), 1000);
      },
      cardType: 'revenue' as const
    },
    { title: "Feed Left in Stock", value: `${(summary.feedLeft || 0).toLocaleString()} kg`, icon: Zap, color: "bg-green-500" },
  ];

  const handleQuickAction = (action: any) => {
    if (action.href) {
      router.push(action.href);
    } else if (action.id === "add-flock") {
      setIsFlockDialogOpen(true);
    } else if (action.id === "record-feed-usage") {
      setIsFeedUsageDialogOpen(true);
    } else {
      setSelectedQuickAction(action.id);
      setIsQuickActionOpen(true);
    }
  };

  const handleCloseQuickAction = () => {
    setIsQuickActionOpen(false);
    setSelectedQuickAction(null);
  };

  const handleFeedUsageSubmit = async (data: any) => {
    try {
      const result = await createFeedUsageAction(data);
      if (result.success) {
        toast.success("Feed usage recorded successfully!");
        setIsFeedUsageDialogOpen(false);
      } else {
        toast.error("Failed to record feed usage", {
          description: result.error || "An unexpected error occurred",
        });
      }
    } catch (error) {
      console.error("Error recording feed usage:", error);
      toast.error("Failed to record feed usage", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  };

  // Attendance functions
  const handleCheckIn = async (staffId: string) => {
    try {
      const result = await checkIn(staffId);
      if (result.success) {
        toast.success("Checked in successfully");
        // Update button state to checkout
        setButtonStates(prev => ({ ...prev, [staffId]: 'checkout' }));
        // Reload attendance data
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const attendanceResult = await getAttendance({
          dateRange: {
            start: today,
            end: tomorrow
          },
          page: 1,
          limit: 100
        });

        if (attendanceResult.success && attendanceResult.data) {
          setAttendanceRecords(attendanceResult.data);
        }
      } else {
        toast.error(result.message || "Failed to check in");
      }
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error("Failed to check in");
    }
  };

  const handleCheckOut = async (staffId: string) => {
    try {
      const result = await checkOut(staffId);
      if (result.success) {
        toast.success("Checked out successfully");
        // Update button state to checkedout
        setButtonStates(prev => ({ ...prev, [staffId]: 'checkedout' }));
        // Reload attendance data
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const attendanceResult = await getAttendance({
          dateRange: {
            start: today,
            end: tomorrow
          },
          page: 1,
          limit: 100
        });

        if (attendanceResult.success && attendanceResult.data) {
          setAttendanceRecords(attendanceResult.data);
        }
      } else {
        toast.error(result.message || "Failed to check out");
      }
    } catch (error) {
      console.error('Error checking out:', error);
      toast.error("Failed to check out");
    }
  };

  // Get attendance status for a staff member
  const getStaffAttendanceStatus = (staffId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayRecord = attendanceRecords.find(record => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      return record.staffId === staffId && recordDate.getTime() === today.getTime();
    });
    
    if (!todayRecord) return { status: 'not-checked', buttonText: 'Check In', action: 'checkin' };
    
    if (todayRecord.status === 'CHECKED_IN' && !todayRecord.checkOut) {
      return { status: 'checked-in', buttonText: 'Check Out', action: 'checkout' };
    }
    
    if (todayRecord.status === 'PRESENT') {
      return { status: 'completed', buttonText: 'Completed', action: 'completed' };
    }
    
    return { status: 'not-checked', buttonText: 'Check In', action: 'checkin' };
  };

  const handleCreateFlock = async (data: any) => {
    try {
      setDialogLoading(true);
      
      // Import the createFlock function dynamically to avoid SSR issues
      const { createFlock } = await import("@/server/flocks");
      
      const result = await createFlock({
        batchCode: data.batchCode,
        arrivalDate: data.arrivalDate,
        initialCount: data.initialCount,
        currentCount: data.currentCount,
        ageInDays: data.ageInDays,
        notes: data.notes,
      });
      
      if (result.success) {
        toast.success("Flock created successfully!", {
          description: `Batch ${data.batchCode} has been added to your flocks.`
        });
        
        setIsFlockDialogOpen(false);
        // Refresh the page to show updated data
        router.refresh();
      } else {
        toast.error("Failed to create flock", {
          description: result.message || "An unexpected error occurred."
        });
      }
    } catch (error) {
      console.error('Error creating flock:', error);
      toast.error("Failed to create flock", {
        description: "An unexpected error occurred. Please try again."
      });
    } finally {
      setDialogLoading(false);
    }
  };

  const handleGenerateBatchCode = async (breed: string) => {
    try {
      // Import the generateBatchCode function dynamically to avoid SSR issues
      const { generateBatchCode } = await import("@/server/flocks");
      
      const result = await generateBatchCode(breed);
      
      if (result.success && result.data?.batchCode) {
        return result.data.batchCode;
      } else {
        console.error('Failed to generate batch code:', result.message);
        return null;
      }
    } catch (error) {
      console.error('Error generating batch code:', error);
      return null;
    }
  };

  const getAlertColor = (priority: string) => {
    const colorMap: { [key: string]: string } = {
      high: "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/20 dark:border-red-800",
      medium: "text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950/20 dark:border-yellow-800",
      low: "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/20 dark:border-blue-800",
    };
    return colorMap[priority] || "text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-950/20 dark:border-gray-800";
  };

  // Generate inventory alerts
  const inventoryAlerts: { id: number; message: string; priority: "high" | "medium" | "low" }[] = [];
  
  if (inventoryCounts.eggs > 0) {
    inventoryAlerts.push({
      id: 1,
      message: `${inventoryCounts.eggs.toLocaleString()} eggs available in inventory`,
      priority: "medium"
    });
  }
  
  if (inventoryCounts.feed > 0) {
    inventoryAlerts.push({
      id: 2,
      message: `${inventoryCounts.feed.toLocaleString()} kg of feed available in inventory`,
      priority: "medium"
    });
  }
  
  if (inventoryCounts.medicine > 0) {
    inventoryAlerts.push({
      id: 3,
      message: `${inventoryCounts.medicine.toLocaleString()} units of medicine available in inventory`,
      priority: "medium"
    });
  }
  
  if (inventoryCounts.broilers > 0) {
    inventoryAlerts.push({
      id: 4,
      message: `${inventoryCounts.broilers.toLocaleString()} broilers available in inventory`,
      priority: "medium"
    });
  }
  
  if (inventoryCounts.manure > 0) {
    inventoryAlerts.push({
      id: 5,
      message: `${inventoryCounts.manure.toLocaleString()} kg of manure available in inventory`,
      priority: "low"
    });
  }

  const alerts: { id: number; message: string; priority: "high" | "medium" | "low" }[] = [...inventoryAlerts];

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your poultry management system. Quick access to all features.</p>
        </div>
        {/* Removed search and refresh controls as requested */}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                {stat.hasDropdown ? (
                  <Select value={stat.dropdownValue} onValueChange={stat.onDropdownChange}>
                    <SelectTrigger className="w-52 h-8 text-sm font-medium bg-background border-border hover:bg-accent transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="min-w-[224px]">
                      {getTimePeriodOptions(stat.cardType).map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-xs">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                )}
                <div className={cn("p-2 rounded-lg", stat.color || "bg-muted")}>
                  <Icon className={cn("h-4 w-4", stat.color ? "text-white" : "text-muted-foreground")} />
                </div>
              </CardHeader>
              <CardContent>
                {getCardLoadingState(stat.cardType) ? (
                  <div className="text-2xl font-bold">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                      {stat.title === "Egg Production" && "eggs"}
                      {stat.title === "Expenses" && "total spent"}
                      {stat.title === "Revenue" && "total earned"}
                      {stat.title === "Feed Left in Stock" && "remaining"}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions and Alerts in the same row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Actions */}
        <Card className="min-h-[420px]">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks across the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {[
                { id: "record-feed-usage", title: "Record Feed Usage", icon: Calculator, color: "bg-yellow-600" },
                { id: "record-production", title: "Record Egg Production", icon: Egg, color: "bg-green-500" },
                { id: "record-broiler-production", title: "Record Broiler Production", icon: Bird, color: "bg-orange-500" },
                { id: "record-manure-production", title: "Record Manure Production", icon: Droplets, color: "bg-green-700" },
                { id: "add-expense", title: "Add Expense", icon: Minus, color: "bg-purple-500" },
                { id: "add-revenue", title: "Add Revenue", icon: DollarSign, color: "bg-green-600" },
                { id: "add-staff", title: "Add Staff Member", icon: UserPlus, color: "bg-indigo-500" },
                { id: "add-flock", title: "Add New Flock", icon: Bird, color: "bg-blue-500" },
              ].map((action: any) => {
                const Icon = action.icon as any;
                return (
                  <Button key={action.id} variant="outline" className="w-full justify-start h-14" onClick={() => handleQuickAction(action)}>
                    <span className={cn("p-2 rounded-lg mr-2", action.color)}>
                      <Icon className="h-4 w-4 text-white" />
                    </span>
                    {action.title}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card className="min-h-[420px]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Alerts & Notifications
                </CardTitle>
                <CardDescription>Important reminders across the system</CardDescription>
              </div>
              {/* Removed refresh button as requested */}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="alerts" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="alerts">Alerts</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
              </TabsList>
              <TabsContent value="alerts" className="mt-4 space-y-2">
                {alerts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="rounded-full bg-muted/50 p-6 mb-4">
                      <Bell className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-base font-medium text-muted-foreground mb-2">No alerts yet</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-sm">
                      New alerts will appear here when they're available.
                    </p>
                  </div>
                )}
                {alerts.map((alert) => (
                  <div key={alert.id} className={cn("flex items-center p-3 rounded-lg border", getAlertColor(alert.priority))}>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">{alert.message}</span>
                    </div>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="attendance" className="mt-4">
                {staffLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Loading staff attendance...</p>
                    </div>
                  </div>
                ) : staff.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No staff members found.</div>
                ) : (
                  <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                    {staff.filter(member => member.isActive && member.role === 'WORKER').map((member) => {
                      const attendanceStatus = getStaffAttendanceStatus(member.id);
                      const todayRecord = attendanceRecords.find(record => {
                        const recordDate = new Date(record.date);
                        recordDate.setHours(0, 0, 0, 0);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return record.staffId === member.id && recordDate.getTime() === today.getTime();
                      });

                      return (
                        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
                              <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{member.name}</div>
                              <div className="text-xs text-muted-foreground">{member.role}</div>
                              {todayRecord?.checkIn && (
                                <div className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  In: {new Date(todayRecord.checkIn).toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })}
                                </div>
                              )}
                              {todayRecord?.checkOut && (
                                <div className="text-xs text-red-600 dark:text-red-400 flex items-center mt-1">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Out: {new Date(todayRecord.checkOut).toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {(() => {
                              const buttonState = buttonStates[member.id];
                              
                              if (buttonState === 'onleave') {
                                return (
                                  <Badge className="bg-blue-100 text-blue-800">
                                    On Leave
                                  </Badge>
                                );
                              }

                              if (buttonState === 'checkout') {
                                return (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCheckOut(member.id)}
                                    className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/20"
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Check Out
                                  </Button>
                                );
                              }

                              if (buttonState === 'checkedout') {
                                return (
                                  <Badge className="bg-purple-100 text-purple-800">
                                    Checked Out
                                  </Badge>
                                );
                              }

                              // Default to check in button
                              return (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCheckIn(member.id)}
                                  className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950/20"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Check In
                                </Button>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Dialog */}
      <QuickActionDialog 
        isOpen={isQuickActionOpen} 
        onClose={handleCloseQuickAction} 
        actionType={selectedQuickAction}
        onRefresh={() => router.refresh()}
      />
      
      {/* Reusable Flock Creation Dialog */}
      <ReusableDialog
        open={isFlockDialogOpen}
        onOpenChange={setIsFlockDialogOpen}
        config={{
          schema: flockSchema,
          defaultValues: {
            batchCode: "",
            arrivalDate: new Date(),
            initialCount: 0,
            currentCount: 0,
            ageInDays: 0,
            notes: "",
          },
          title: "Add New Flock",
          description: "Create a new flock with unique batch code and tracking information",
          submitText: "Create Flock",
          onSubmit: handleCreateFlock,
          maxWidth: "max-w-3xl",
          children: (form) => (
            <FlockForm 
              form={form} 
              flocks={[]} // Empty array for home page - no existing flocks to reference
              onGenerateBatchCode={handleGenerateBatchCode}
            />
          ),
        }}
        loading={dialogLoading}
      />

      {/* Feed Usage Dialog */}
      <FeedUsageDialog
        isOpen={isFeedUsageDialogOpen}
        onClose={() => setIsFeedUsageDialogOpen(false)}
        onSubmit={handleFeedUsageSubmit}
        title="Record Feed Usage"
        description="Quickly record feed usage for any flock from the home page."
        submitButtonText="Record Usage"
      />
    </div>
  );
}


