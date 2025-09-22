"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Calendar as CalendarIcon,
  UserPlus,
  Activity,
  FileText,
  Settings,
  Eye,
  Download,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickActionDialog } from "@/components/home/quick-action-dialog";
import { QuickStats } from "@/components/home/quick-stats";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type DashboardSummary = {
  eggsToday: number;
  expensesToday: number;
  salesToday: number;
  feedLeft: number;
};

export default function HomeClient({ summary }: { summary: DashboardSummary }) {
  const router = useRouter();
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [selectedQuickAction, setSelectedQuickAction] = useState<string | null>(null);

  const kpiStats = [
    { title: "Today's Egg Production", value: (summary.eggsToday || 0).toLocaleString(), icon: Egg, color: "bg-yellow-500" },
    { title: "Today's Expenses", value: `$${(summary.expensesToday || 0).toLocaleString()}`, icon: Minus, color: "bg-rose-500" },
    { title: "Today's Sales", value: `$${(summary.salesToday || 0).toLocaleString()}`, icon: DollarSign, color: "bg-purple-500" },
    { title: "Feed Left in Stock", value: `${(summary.feedLeft || 0).toLocaleString()} kg`, icon: Zap, color: "bg-green-500" },
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

  const alerts: { id: number; message: string; priority: "high" | "medium" | "low" }[] = [];
  const notifications: { id: number; message: string; priority: "high" | "medium" | "low" }[] = [];

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
      {/* @ts-ignore QuickStats accepts this shape */}
      <QuickStats stats={kpiStats} />

      {/* Quick Actions and Alerts in the same row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Actions */}
        <Card className="min-h-[420px]">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks across the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { id: "add-flock", title: "Add New Flock", icon: Bird, color: "bg-blue-500" },
              { id: "record-production", title: "Record Egg Production", icon: Egg, color: "bg-green-500" },
              { id: "add-expense", title: "Add Expense", icon: Minus, color: "bg-purple-500" },
              { id: "add-staff", title: "Add Staff Member", icon: UserPlus, color: "bg-indigo-500" },
              { id: "record-vaccination", title: "Record Vaccination", icon: Heart, color: "bg-red-500", href: "/health" },
              { id: "record-feed-usage", title: "Record Feed Usage", icon: Calculator, color: "bg-yellow-600", href: "/feed?tab=usage" },
              { id: "manage-suppliers", title: "Manage Suppliers", icon: Database, color: "bg-yellow-700", href: "/feed?tab=suppliers" },
              { id: "financial-reports", title: "Financial Reports", icon: FileText, color: "bg-purple-700", href: "/reports?tab=financial" },
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
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>
              <TabsContent value="alerts" className="mt-4 space-y-2">
                {alerts.length === 0 && (
                  <div className="text-sm text-muted-foreground">No alerts yet.</div>
                )}
                {alerts.map((alert) => (
                  <div key={alert.id} className={cn("flex items-center justify-between p-3 rounded-lg border", getAlertColor(alert.priority))}>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">{alert.message}</span>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="notifications" className="mt-4 space-y-2">
                {notifications.length === 0 && (
                  <div className="text-sm text-muted-foreground">No notifications yet.</div>
                )}
                {notifications.map((note) => (
                  <div key={note.id} className={cn("flex items-center justify-between p-3 rounded-lg border", getAlertColor(note.priority))}>
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4" />
                      <span className="text-sm font-medium">{note.message}</span>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Dialog */}
      <QuickActionDialog isOpen={isQuickActionOpen} onClose={handleCloseQuickAction} actionType={selectedQuickAction} />
    </div>
  );
}


