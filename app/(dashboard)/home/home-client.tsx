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
  UserCheck,
  Package
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickActionDialog } from "@/app/(dashboard)/home/components/quick-action-dialog";
import { ReusableDialog } from "@/components/ui/reusable-dialog";
import { FlockForm, flockSchema } from "@/components/forms/dialog-forms";
import { FeedUsageDialog } from "@/app/(dashboard)/feed/components/usage/feed-usage-dialog";
import { FeedInventoryDialog } from "@/app/(dashboard)/feed/components/inventory/feed-inventory-dialog";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState as useStateReact } from "react";
import { toast } from "sonner";
import { InventoryCounts } from "@/app/(dashboard)/feed/server/inventory-alerts";
import { getStaff } from "@/app/(dashboard)/staff/server/staff";
import { checkIn, checkOut, getAttendance, isStaffOnLeave } from "@/app/(dashboard)/staff/server/attendance";
import { getKPIData } from "@/app/(dashboard)/reports/server/kpi-data";
import { createFeedUsageAction } from "@/app/(dashboard)/feed/server/feed-usage";
import { PageBanner } from "@/components/ui/page-banner";
import { useTranslations } from 'next-intl';

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

export default function HomeClient({ summary, inventoryCounts, upcomingVaccinations }: { summary: DashboardSummary; inventoryCounts: InventoryCounts; upcomingVaccinations: any[] }) {
  const router = useRouter();
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [selectedQuickAction, setSelectedQuickAction] = useState<string | null>(null);
  const [isFlockDialogOpen, setIsFlockDialogOpen] = useState(false);
  const [isFeedUsageDialogOpen, setIsFeedUsageDialogOpen] = useState(false);
  const [isFeedInventoryDialogOpen, setIsFeedInventoryDialogOpen] = useState(false);
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
    const keyPrefix = cardType === 'production' ? 'Production' : cardType === 'expenses' ? 'Expenses' : 'Revenue';
    
    return [
      { value: "today", label: t(`timePeriods.today${keyPrefix}`) },
      { value: "week", label: t(`timePeriods.week${keyPrefix}`) },
      { value: "month", label: t(`timePeriods.month${keyPrefix}`) },
      { value: "3months", label: t(`timePeriods.3months${keyPrefix}`) },
      { value: "6months", label: t(`timePeriods.6months${keyPrefix}`) },
      { value: "year", label: t(`timePeriods.year${keyPrefix}`) }
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
      title: t('kpiStats.eggProduction'), 
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
      title: t('kpiStats.expenses'), 
      value: `${tCommon('currency')} ${dynamicData.expenses.toLocaleString()}`, 
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
      title: t('kpiStats.revenue'), 
      value: `${tCommon('currency')} ${dynamicData.revenue.toLocaleString()}`, 
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
    { title: t('kpiStats.feedLeftInStock'), value: `${(summary.feedLeft || 0).toLocaleString()} ${t('kpiStats.kg')}`, icon: Zap, color: "bg-green-500" },
  ];

  const handleQuickAction = (action: any) => {
    if (action.href) {
      router.push(action.href);
    } else if (action.id === "add-flock") {
      setIsFlockDialogOpen(true);
    } else if (action.id === "record-feed-usage") {
      setIsFeedUsageDialogOpen(true);
    } else if (action.id === "add-feed-inventory") {
      setIsFeedInventoryDialogOpen(true);
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
        toast.success(t('dialogs.feedUsageRecorded'));
        setIsFeedUsageDialogOpen(false);
      } else {
        toast.error(t('dialogs.feedUsageFailed'), {
          description: result.error || "An unexpected error occurred",
        });
      }
    } catch (error) {
      console.error("Error recording feed usage:", error);
      toast.error(t('dialogs.feedUsageFailed'), {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  };

  // Attendance functions
  const handleCheckIn = async (staffId: string) => {
    try {
      const result = await checkIn(staffId);
      if (result.success) {
        toast.success(t('attendance.checkedInSuccess'));
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
        toast.error(result.message || t('attendance.checkInFailed'));
      }
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error(t('attendance.checkInFailed'));
    }
  };

  const handleCheckOut = async (staffId: string) => {
    try {
      const result = await checkOut(staffId);
      if (result.success) {
        toast.success(t('attendance.checkedOutSuccess'));
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
        toast.error(result.message || t('attendance.checkOutFailed'));
      }
    } catch (error) {
      console.error('Error checking out:', error);
      toast.error(t('attendance.checkOutFailed'));
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
      const { createFlock } = await import("@/app/(dashboard)/flocks/server/flocks");
      
      const result = await createFlock({
        batchCode: data.batchCode,
        arrivalDate: data.arrivalDate,
        initialCount: data.initialCount,
        currentCount: data.currentCount,
        ageInDays: data.ageInDays,
        notes: data.notes,
      });
      
      if (result.success) {
        toast.success(t('dialogs.flockCreatedSuccess'), {
          description: `${data.batchCode} ${t('dialogs.flockCreatedDescription')}`
        });
        
        setIsFlockDialogOpen(false);
        // Refresh the page to show updated data
        router.refresh();
      } else {
        toast.error(t('dialogs.flockCreateFailed'), {
          description: result.message || "An unexpected error occurred."
        });
      }
    } catch (error) {
      console.error('Error creating flock:', error);
      toast.error(t('dialogs.flockCreateFailed'), {
        description: "An unexpected error occurred. Please try again."
      });
    } finally {
      setDialogLoading(false);
    }
  };

  const handleGenerateBatchCode = async (breed: string) => {
    try {
      // Import the generateBatchCode function dynamically to avoid SSR issues
      const { generateBatchCode } = await import("@/app/(dashboard)/flocks/server/flocks");
      
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
      message: `${inventoryCounts.eggs.toLocaleString()} ${t('alerts.eggsAvailable')}`,
      priority: "medium"
    });
  }
  
  if (inventoryCounts.feed > 0) {
    inventoryAlerts.push({
      id: 2,
      message: `${inventoryCounts.feed.toLocaleString()} ${t('alerts.feedAvailable')}`,
      priority: "medium"
    });
  }
  
  if (inventoryCounts.medicine > 0) {
    inventoryAlerts.push({
      id: 3,
      message: `${inventoryCounts.medicine.toLocaleString()} ${t('alerts.medicineAvailable')}`,
      priority: "medium"
    });
  }
  
  if (inventoryCounts.broilers > 0) {
    inventoryAlerts.push({
      id: 4,
      message: `${inventoryCounts.broilers.toLocaleString()} ${t('alerts.broilersAvailable')}`,
      priority: "medium"
    });
  }
  
  if (inventoryCounts.manure > 0) {
    inventoryAlerts.push({
      id: 5,
      message: `${inventoryCounts.manure.toLocaleString()} ${t('alerts.manureAvailable')}`,
      priority: "low"
    });
  }

  // Generate vaccination reminder alerts
  const vaccinationAlerts: { id: number; message: string; priority: "high" | "medium" | "low" }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  upcomingVaccinations?.forEach((vaccination: any, index: number) => {
    if (vaccination.scheduledDate) {
      const scheduledDate = new Date(vaccination.scheduledDate);
      scheduledDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let priority: "high" | "medium" | "low" = "medium";
      let message = "";
      
      if (daysUntil === 0) {
        priority = "high";
        message = `Vaccination due today: ${vaccination.vaccineName} for flock ${vaccination.flock?.batchCode || 'N/A'}`;
      } else if (daysUntil === 1) {
        priority = "high";
        message = `Vaccination due tomorrow: ${vaccination.vaccineName} for flock ${vaccination.flock?.batchCode || 'N/A'}`;
      } else if (daysUntil <= 3) {
        priority = "high";
        message = `Vaccination due in ${daysUntil} days: ${vaccination.vaccineName} for flock ${vaccination.flock?.batchCode || 'N/A'}`;
      } else if (daysUntil <= 7) {
        priority = "medium";
        message = `Upcoming vaccination in ${daysUntil} days: ${vaccination.vaccineName} for flock ${vaccination.flock?.batchCode || 'N/A'}`;
      } else {
        priority = "low";
        message = `Scheduled vaccination in ${daysUntil} days: ${vaccination.vaccineName} for flock ${vaccination.flock?.batchCode || 'N/A'}`;
      }
      
      vaccinationAlerts.push({
        id: 1000 + index, // High ID to avoid conflicts
        message,
        priority
      });
    }
  });

  const alerts: { id: number; message: string; priority: "high" | "medium" | "low" }[] = [...vaccinationAlerts, ...inventoryAlerts];

  // Helper function to format feed type names
  const formatFeedType = (feedType: string) => {
    return feedType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">{t('loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <PageBanner
        title={t('title')}
        description={t('description')}
        imageSrc="/hero-bg-image.webp"
      />

      {/* Main Content */}

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
                      {stat.title === t('kpiStats.eggProduction') && t('kpiStats.eggs')}
                      {stat.title === t('kpiStats.expenses') && t('kpiStats.totalSpent')}
                      {stat.title === t('kpiStats.revenue') && t('kpiStats.totalEarned')}
                      {stat.title === t('kpiStats.feedLeftInStock') && t('kpiStats.remaining')}
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
            <CardTitle>{t('quickActions.title')}</CardTitle>
            <CardDescription>{t('quickActions.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {[
                { id: "record-feed-usage", title: t('quickActions.recordFeedUsage'), icon: Calculator, color: "bg-yellow-600" },
                { id: "add-feed-inventory", title: t('quickActions.addFeedInventory'), icon: Package, color: "bg-amber-600" },
                { id: "record-production", title: t('quickActions.recordEggProduction'), icon: Egg, color: "bg-green-500" },
                { id: "record-broiler-production", title: t('quickActions.recordBroilerProduction'), icon: Bird, color: "bg-orange-500" },
                { id: "record-manure-production", title: t('quickActions.recordManureProduction'), icon: Droplets, color: "bg-green-700" },
                { id: "add-expense", title: t('quickActions.addExpense'), icon: Minus, color: "bg-purple-500" },
                { id: "add-revenue", title: t('quickActions.addRevenue'), icon: DollarSign, color: "bg-green-600" },
                { id: "add-staff", title: t('quickActions.addStaffMember'), icon: UserPlus, color: "bg-indigo-500" },
                { id: "add-flock", title: t('quickActions.addNewFlock'), icon: Bird, color: "bg-blue-500" },
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
                  {t('alerts.title')}
                </CardTitle>
                <CardDescription>{t('alerts.description')}</CardDescription>
              </div>
              {/* Removed refresh button as requested */}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="alerts" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="alerts">{t('alerts.tabAlerts')}</TabsTrigger>
                <TabsTrigger value="attendance">{t('alerts.tabAttendance')}</TabsTrigger>
              </TabsList>
              <TabsContent value="alerts" className="mt-4 space-y-3">
                {alerts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="rounded-full bg-muted/50 p-6 mb-4">
                      <Bell className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-base font-medium text-muted-foreground mb-2">{t('alerts.noAlertsTitle')}</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-sm">
                      {t('alerts.noAlertsDescription')}
                    </p>
                  </div>
                )}
                
                {/* Enhanced Egg Inventory Card */}
                {inventoryCounts.eggBreakdown && inventoryCounts.eggBreakdown.total > 0 && (
                  <div className="bg-gradient-to-br from-green-50/60 to-emerald-50/60 dark:from-green-950/10 dark:to-emerald-950/10 border border-green-200/60 dark:border-green-800/40 rounded-lg p-3 sm:p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-0 mb-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-2 sm:p-2.5 bg-green-100/70 dark:bg-green-900/20 rounded-lg">
                          <Egg className="h-4 w-4 sm:h-5 sm:w-5 text-green-600/90 dark:text-green-400/80" />
                        </div>
                        <div>
                          <h4 className="text-sm sm:text-base font-semibold text-green-800 dark:text-green-200">{t('alerts.inventory.eggs')}</h4>
                          <p className="text-xl sm:text-2xl font-bold text-green-700/90 dark:text-green-300/90">
                            {inventoryCounts.eggBreakdown.total.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-600/80 text-white self-start text-xs">{t('alerts.inventory.available')}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-3">
                      <div className="bg-white/80 dark:bg-gray-900/30 rounded-md p-2 sm:p-3 border border-green-100/60 dark:border-green-900/40">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500/80"></div>
                          <span className="text-[10px] sm:text-xs font-medium text-green-700/90 dark:text-green-300/80">{t('alerts.inventory.normal')}</span>
                        </div>
                        <p className="text-sm sm:text-lg font-bold text-green-800 dark:text-green-200">
                          {inventoryCounts.eggBreakdown.normal.toLocaleString()}
                        </p>
                        <p className="text-[10px] sm:text-xs text-green-600/80 dark:text-green-400/70">
                          {((inventoryCounts.eggBreakdown.normal / inventoryCounts.eggBreakdown.total) * 100).toFixed(2)}%
                        </p>
                      </div>
                      <div className="bg-white/80 dark:bg-gray-900/30 rounded-md p-2 sm:p-3 border border-orange-100/60 dark:border-orange-900/40">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-orange-500/80"></div>
                          <span className="text-[10px] sm:text-xs font-medium text-orange-700/90 dark:text-orange-300/80">{t('alerts.inventory.cracked')}</span>
                        </div>
                        <p className="text-sm sm:text-lg font-bold text-orange-800 dark:text-orange-200">
                          {inventoryCounts.eggBreakdown.cracked.toLocaleString()}
                        </p>
                        <p className="text-[10px] sm:text-xs text-orange-600/80 dark:text-orange-400/70">
                          {((inventoryCounts.eggBreakdown.cracked / inventoryCounts.eggBreakdown.total) * 100).toFixed(2)}%
                        </p>
                      </div>
                      <div className="bg-white/80 dark:bg-gray-900/30 rounded-md p-2 sm:p-3 border border-red-100/60 dark:border-red-900/40">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500/80"></div>
                          <span className="text-[10px] sm:text-xs font-medium text-red-700/90 dark:text-red-300/80">{t('alerts.inventory.spoiled')}</span>
                        </div>
                        <p className="text-sm sm:text-lg font-bold text-red-800 dark:text-red-200">
                          {inventoryCounts.eggBreakdown.spoiled.toLocaleString()}
                        </p>
                        <p className="text-[10px] sm:text-xs text-red-600/80 dark:text-red-400/70">
                          {((inventoryCounts.eggBreakdown.spoiled / inventoryCounts.eggBreakdown.total) * 100).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Feed Inventory Card */}
                {inventoryCounts.feedBreakdown && inventoryCounts.feedBreakdown.total > 0 && (
                  <div className="bg-gradient-to-br from-amber-50/60 to-yellow-50/60 dark:from-amber-950/10 dark:to-yellow-950/10 border border-amber-200/60 dark:border-amber-800/40 rounded-lg p-3 sm:p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-0 mb-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-2 sm:p-2.5 bg-amber-100/70 dark:bg-amber-900/20 rounded-lg">
                          <Package className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600/90 dark:text-amber-400/80" />
                        </div>
                        <div>
                          <h4 className="text-sm sm:text-base font-semibold text-amber-800 dark:text-amber-200">{t('alerts.inventory.feedStock')}</h4>
                          <p className="text-xl sm:text-2xl font-bold text-amber-700/90 dark:text-amber-300/90">
                            {inventoryCounts.feedBreakdown.total.toLocaleString()} {t('alerts.inventory.kg')}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-amber-600/80 text-white self-start text-xs">{t('alerts.inventory.available')}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-3">
                      {Object.entries(inventoryCounts.feedBreakdown)
                        .filter(([key]) => key !== 'total')
                        .map(([feedType, quantity]) => (
                          <div key={feedType} className="bg-white/80 dark:bg-gray-900/30 rounded-md p-2 sm:p-3 border border-amber-100/60 dark:border-amber-900/40">
                            <div className="flex items-center gap-1.5 mb-1">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500/80"></div>
                              <span className="text-[10px] sm:text-xs font-medium text-amber-700/90 dark:text-amber-300/80 truncate">
                                {formatFeedType(feedType)}
                              </span>
                            </div>
                            <p className="text-sm sm:text-lg font-bold text-amber-800 dark:text-amber-200">
                              {quantity.toLocaleString()} {t('alerts.inventory.kg')}
                            </p>
                            <p className="text-[10px] sm:text-xs text-amber-600/80 dark:text-amber-400/70">
                              {((quantity / inventoryCounts.feedBreakdown!.total) * 100).toFixed(2)}%
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Enhanced Manure Inventory Card */}
                {inventoryCounts.manure > 0 && (
                  <div className="bg-gradient-to-br from-purple-50/60 to-indigo-50/60 dark:from-purple-950/10 dark:to-indigo-950/10 border border-purple-200/60 dark:border-purple-800/40 rounded-lg p-3 sm:p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-0">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-2 sm:p-2.5 bg-purple-100/70 dark:bg-purple-900/20 rounded-lg">
                          <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600/90 dark:text-purple-400/80" />
                        </div>
                        <div>
                          <h4 className="text-sm sm:text-base font-semibold text-purple-800 dark:text-purple-200">{t('alerts.inventory.manure')}</h4>
                          <p className="text-xl sm:text-2xl font-bold text-purple-700/90 dark:text-purple-300/90">
                            {inventoryCounts.manure.toLocaleString()} {t('alerts.inventory.kg')}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-purple-600/80 text-white self-start text-xs">{t('alerts.inventory.available')}</Badge>
                    </div>
                  </div>
                )}

                {/* Other alerts */}
                {inventoryCounts.medicine > 0 && (
                  <div className="bg-gradient-to-br from-blue-50/60 to-cyan-50/60 dark:from-blue-950/10 dark:to-cyan-950/10 border border-blue-200/60 dark:border-blue-800/40 rounded-lg p-3 sm:p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-0">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-2 sm:p-2.5 bg-blue-100/70 dark:bg-blue-900/20 rounded-lg">
                          <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600/90 dark:text-blue-400/80" />
                        </div>
                        <div>
                          <h4 className="text-sm sm:text-base font-semibold text-blue-800 dark:text-blue-200">{t('alerts.inventory.medicine')}</h4>
                          <p className="text-xl sm:text-2xl font-bold text-blue-700/90 dark:text-blue-300/90">
                            {inventoryCounts.medicine.toLocaleString()} {t('alerts.inventory.units')}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-blue-600/80 text-white self-start text-xs">{t('alerts.inventory.available')}</Badge>
                    </div>
                  </div>
                )}

                {inventoryCounts.broilers > 0 && (
                  <div className="bg-gradient-to-br from-orange-50/60 to-red-50/60 dark:from-orange-950/10 dark:to-red-950/10 border border-orange-200/60 dark:border-orange-800/40 rounded-lg p-3 sm:p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-0">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-2 sm:p-2.5 bg-orange-100/70 dark:bg-orange-900/20 rounded-lg">
                          <Bird className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600/90 dark:text-orange-400/80" />
                        </div>
                        <div>
                          <h4 className="text-sm sm:text-base font-semibold text-orange-800 dark:text-orange-200">{t('alerts.inventory.broilers')}</h4>
                          <p className="text-xl sm:text-2xl font-bold text-orange-700/90 dark:text-orange-300/90">
                            {inventoryCounts.broilers.toLocaleString()} {t('alerts.inventory.birds')}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-orange-600/80 text-white self-start text-xs">{t('alerts.inventory.available')}</Badge>
                    </div>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="attendance" className="mt-4">
                {staffLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-sm text-muted-foreground">{t('attendance.loadingStaff')}</p>
                    </div>
                  </div>
                ) : staff.length === 0 ? (
                  <div className="text-sm text-muted-foreground">{t('attendance.noStaff')}</div>
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
                                  {t('attendance.in')}: {new Date(todayRecord.checkIn).toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })}
                                </div>
                              )}
                              {todayRecord?.checkOut && (
                                <div className="text-xs text-red-600 dark:text-red-400 flex items-center mt-1">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  {t('attendance.out')}: {new Date(todayRecord.checkOut).toLocaleTimeString('en-US', { 
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
                                    {t('attendance.onLeave')}
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
                                    {t('attendance.checkOut')}
                                  </Button>
                                );
                              }

                              if (buttonState === 'checkedout') {
                                return (
                                  <Badge className="bg-purple-100 text-purple-800">
                                    {t('attendance.checkedOut')}
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
                                  {t('attendance.checkIn')}
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
          title: t('dialogs.addNewFlock'),
          description: t('dialogs.addFlockDescription'),
          submitText: t('dialogs.createFlock'),
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
        title={t('dialogs.recordFeedUsageTitle')}
        description={t('dialogs.recordFeedUsageDescription')}
        submitButtonText={t('dialogs.recordUsage')}
      />

      {/* Feed Inventory Dialog */}
      <FeedInventoryDialog
        isOpen={isFeedInventoryDialogOpen}
        onClose={() => setIsFeedInventoryDialogOpen(false)}
        title={t('dialogs.addFeedInventoryTitle')}
        description={t('dialogs.addFeedInventoryDescription')}
        submitButtonText={t('dialogs.addFeedInventory')}
      />
    </div>
  );
}


