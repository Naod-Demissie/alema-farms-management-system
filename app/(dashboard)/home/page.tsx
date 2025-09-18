"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus,
  Users,
  Bird,
  Heart,
  Egg,
  Utensils,
  DollarSign,
  BarChart3,
  Clock,
  AlertTriangle,
  TrendingUp,
  Calendar as CalendarIcon,
  UserPlus,
  Activity,
  FileText,
  Settings,
  Eye,
  Download,
  RefreshCw,
  Bell,
  Zap,
  Target,
  PieChart,
  LineChart,
  Database,
  Calculator,
  ArrowRight,
  Minus
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { QuickActionDialog } from "@/components/home/quick-action-dialog";
import { ActivityFeed } from "@/components/home/activity-feed";
import { QuickStats, createStatCards, createAlertCards } from "@/components/home/quick-stats";
import { QuickSearch } from "@/components/home/quick-search";

// Mock data - replace with actual data fetching
const mockStats = {
  totalFlocks: 12,
  activeStaff: 24,
  todayProduction: 1250,
  monthlyRevenue: 45000,
  healthAlerts: 3,
  pendingTasks: 7,
  feedStock: 85,
  attendanceRate: 94.5
};

const mockRecentActivity = [
  { id: 1, action: "New flock added: Batch #FLK-2024-001", time: "2 minutes ago", type: "flock", icon: Bird, status: "success" },
  { id: 2, action: "Egg production recorded: 1,250 eggs", time: "15 minutes ago", type: "production", icon: Egg, status: "success" },
  { id: 3, action: "John Doe checked in", time: "30 minutes ago", type: "staff", icon: Users, status: "info" },
  { id: 4, action: "Vaccination completed for Flock A", time: "1 hour ago", type: "health", icon: Heart, status: "success" },
  { id: 5, action: "Feed inventory updated", time: "2 hours ago", type: "feed", icon: Utensils, status: "info" },
  { id: 6, action: "Monthly financial report generated", time: "3 hours ago", type: "financial", icon: DollarSign, status: "success" },
  { id: 7, action: "Low feed stock alert for Flock B", time: "4 hours ago", type: "feed", icon: Utensils, status: "warning", details: "Feed stock below 20%" },
  { id: 8, action: "Health checkup scheduled", time: "5 hours ago", type: "health", icon: Heart, status: "info", details: "Routine health check for all flocks" },
];

const mockAlerts = [
  { id: 1, message: "Feed stock running low for Flock B", type: "warning", priority: "high" },
  { id: 2, message: "Vaccination due for Flock C tomorrow", type: "health", priority: "medium" },
  { id: 3, message: "3 staff members on leave today", type: "staff", priority: "low" },
];

export default function HomePage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [selectedQuickAction, setSelectedQuickAction] = useState<string | null>(null);

  const quickActions = [
    // Flock Management
    {
      category: "Flock Management",
      actions: [
        { id: "add-flock", title: "Add New Flock", description: "Register a new flock batch", icon: Bird, color: "bg-blue-500", href: "/flocks" },
        { id: "view-flocks", title: "View All Flocks", description: "Manage existing flocks", icon: Eye, color: "bg-blue-600", href: "/flocks" },
      ]
    },
    // Health & Veterinary
    {
      category: "Health & Veterinary",
      actions: [
        { id: "record-vaccination", title: "Record Vaccination", description: "Log vaccination details", icon: Heart, color: "bg-red-500", href: "/health" },
        { id: "add-treatment", title: "Add Treatment", description: "Record medical treatments", icon: Activity, color: "bg-red-600", href: "/health" },
        { id: "mortality-record", title: "Mortality Record", description: "Record bird deaths", icon: AlertTriangle, color: "bg-red-800", href: "/health?tab=mortality" },
      ]
    },
    // Production Management
    {
      category: "Production Management",
      actions: [
        { id: "record-production", title: "Record Egg Production", description: "Log daily egg production", icon: Egg, color: "bg-green-500", href: "/production" },
        { id: "production-analytics", title: "Production Analytics", description: "View production insights", icon: TrendingUp, color: "bg-green-600", href: "/production?tab=analytics" },
        { id: "quality-assessment", title: "Quality Assessment", description: "Assess egg quality grades", icon: Target, color: "bg-green-700", href: "/production" },
        { id: "production-reports", title: "Production Reports", description: "Generate production reports", icon: FileText, color: "bg-green-800", href: "/reports?tab=production" },
      ]
    },
    // Feed Management
    {
      category: "Feed Management",
      actions: [
        { id: "add-feed-inventory", title: "Add Feed Inventory", description: "Update feed stock levels", icon: Utensils, color: "bg-yellow-500", href: "/feed" },
        { id: "record-feed-usage", title: "Record Feed Usage", description: "Log daily feed consumption", icon: Calculator, color: "bg-yellow-600", href: "/feed?tab=usage" },
        { id: "manage-suppliers", title: "Manage Suppliers", description: "Update supplier information", icon: Database, color: "bg-yellow-700", href: "/feed?tab=suppliers" },
        { id: "feed-analytics", title: "Feed Analytics", description: "Analyze feed costs and usage", icon: PieChart, color: "bg-yellow-800", href: "/feed?tab=analytics" },
      ]
    },
    // Financial Management
    {
      category: "Financial Management",
      actions: [
        { id: "add-expense", title: "Add Expense", description: "Record farm expenses", icon: Minus, color: "bg-purple-500", href: "/financial" },
        { id: "record-revenue", title: "Record Revenue", description: "Log income from sales", icon: Plus, color: "bg-purple-600", href: "/financial" },
        { id: "financial-reports", title: "Financial Reports", description: "Generate financial reports", icon: FileText, color: "bg-purple-700", href: "/reports?tab=financial" },
        { id: "budget-overview", title: "Budget Overview", description: "View budget and forecasts", icon: LineChart, color: "bg-purple-800", href: "/financial" },
      ]
    },
    // Staff Management
    {
      category: "Staff Management",
      actions: [
        { id: "add-staff", title: "Add Staff Member", description: "Register new staff member", icon: UserPlus, color: "bg-indigo-500", href: "/staff" },
        { id: "check-attendance", title: "Check Attendance", description: "View staff attendance records", icon: Clock, color: "bg-indigo-600", href: "/staff?tab=attendance" },
        { id: "process-payroll", title: "Process Payroll", description: "Manage staff payroll", icon: Calculator, color: "bg-indigo-700", href: "/staff?tab=payroll" },
        { id: "leave-requests", title: "Leave Requests", description: "Manage staff leave requests", icon: CalendarIcon, color: "bg-indigo-800", href: "/staff?tab=leave" },
      ]
    },
    // Reports & Analytics
    {
      category: "Reports & Analytics",
      actions: [
        { id: "comprehensive-reports", title: "Comprehensive Reports", description: "Generate all system reports", icon: BarChart3, color: "bg-gray-500", href: "/reports" },
        { id: "export-data", title: "Export Data", description: "Export data to CSV/PDF", icon: Download, color: "bg-gray-600", href: "/reports" },
        { id: "system-analytics", title: "System Analytics", description: "View system-wide analytics", icon: PieChart, color: "bg-gray-700", href: "/reports" },
        { id: "custom-reports", title: "Custom Reports", description: "Create custom reports", icon: Settings, color: "bg-gray-800", href: "/reports" },
      ]
    },
  ];

  const handleQuickAction = (action: any) => {
    if (action.href) {
      router.push(action.href);
    } else {
      setSelectedQuickAction(action.id);
      setIsQuickActionOpen(true);
    }
  };

  const handleCloseQuickAction = () => {
    setIsQuickActionOpen(false);
    setSelectedQuickAction(null);
  };

  const getAlertColor = (priority: string) => {
    const colorMap: { [key: string]: string } = {
      high: "text-red-600 bg-red-50 border-red-200",
      medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
      low: "text-blue-600 bg-blue-50 border-blue-200",
    };
    return colorMap[priority] || "text-gray-600 bg-gray-50 border-gray-200";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your poultry management system. Quick access to all features.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <QuickSearch />
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <QuickStats stats={createStatCards(mockStats)} />

      {/* Alerts */}
      {mockAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    getAlertColor(alert.priority)
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">{alert.message}</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Quick Actions</h2>
          <p className="text-muted-foreground mb-6">
            Access all major features with one click. Find what you need quickly.
          </p>
        </div>

        {quickActions.map((category) => (
          <div key={category.category} className="space-y-4">
            <h3 className="text-lg font-semibold text-muted-foreground">{category.category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {category.actions.map((action) => {
                const Icon = action.icon;
                return (
                  <Card
                    key={action.id}
                    className="cursor-pointer hover:shadow-md transition-shadow duration-200 group"
                    onClick={() => handleQuickAction(action)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className={cn("p-2 rounded-lg", action.color)}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">
                            {action.title}
                          </CardTitle>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-xs">
                        {action.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <ActivityFeed 
        activities={mockRecentActivity}
        onRefresh={() => window.location.reload()}
        onViewAll={() => router.push('/reports')}
      />

      {/* Alert Stats */}
      <QuickStats stats={createAlertCards(mockStats)} />

      {/* Quick Action Dialog */}
      <QuickActionDialog
        isOpen={isQuickActionOpen}
        onClose={handleCloseQuickAction}
        actionType={selectedQuickAction}
      />
    </div>
  );
}
