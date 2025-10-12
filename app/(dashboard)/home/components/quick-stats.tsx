"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bird,
  Users,
  Egg,
  DollarSign,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCard {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease" | "neutral";
  };
  description?: string;
  icon: any;
  color?: string;
  status?: "good" | "warning" | "danger" | "info";
}

interface QuickStatsProps {
  stats: StatCard[];
}

export function QuickStats({ stats }: QuickStatsProps) {
  const getChangeIcon = (type: string) => {
    switch (type) {
      case "increase":
        return <TrendingUp className="h-3 w-3" />;
      case "decrease":
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case "increase":
        return "text-green-600";
      case "decrease":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "good":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "danger":
        return "text-red-600";
      case "info":
        return "text-blue-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={cn("p-2 rounded-lg", stat.color || "bg-muted")}>
                <Icon className={cn("h-4 w-4", stat.color ? "text-white" : "text-muted-foreground")} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.status && (
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", getStatusColor(stat.status))}
                  >
                    {stat.status}
                  </Badge>
                )}
              </div>
              {stat.change && (
                <div className="flex items-center space-x-1 mt-1">
                  {getChangeIcon(stat.change.type)}
                  <span className={cn("text-xs font-medium", getChangeColor(stat.change.type))}>
                    {stat.change.value > 0 ? "+" : ""}{stat.change.value}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    from last period
                  </span>
                </div>
              )}
              {stat.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Predefined stat configurations
export const createStatCards = (data: any) => [
  {
    title: "Total Flocks",
    value: data.totalFlocks || 0,
    change: {
      value: 8.2,
      type: "increase" as const,
    },
    description: "Active flock batches",
    icon: Bird,
    color: "bg-blue-500",
    status: "good" as const,
  },
  {
    title: "Active Staff",
    value: data.activeStaff || 0,
    change: {
      value: 2.1,
      type: "increase" as const,
    },
    description: `${data.attendanceRate || 0}% attendance rate`,
    icon: Users,
    color: "bg-green-500",
    status: "good" as const,
  },
  {
    title: "Today's Production",
    value: (data.todayProduction || 0).toLocaleString(),
    change: {
      value: 5.2,
      type: "increase" as const,
    },
    description: "Eggs produced today",
    icon: Egg,
    color: "bg-yellow-500",
    status: "good" as const,
  },
  {
    title: "Monthly Revenue",
    value: `$${(data.monthlyRevenue || 0).toLocaleString()}`,
    change: {
      value: 12.5,
      type: "increase" as const,
    },
    description: "Total revenue this month",
    icon: DollarSign,
    color: "bg-purple-500",
    status: "good" as const,
  },
];

export const createAlertCards = (data: any) => [
  {
    title: "Feed Stock Level",
    value: `${data.feedStock || 0}%`,
    description: data.feedStock < 20 ? "Low stock alert" : "Stock level good",
    icon: Zap,
    color: data.feedStock < 20 ? "bg-red-500" : "bg-yellow-500",
    status: data.feedStock < 20 ? "danger" as const : "warning" as const,
  },
  {
    title: "Health Alerts",
    value: data.healthAlerts || 0,
    description: "Active health concerns",
    icon: AlertTriangle,
    color: "bg-red-500",
    status: data.healthAlerts > 0 ? "danger" as const : "good" as const,
  },
  {
    title: "Pending Tasks",
    value: data.pendingTasks || 0,
    description: "Tasks requiring attention",
    icon: Clock,
    color: "bg-orange-500",
    status: data.pendingTasks > 5 ? "warning" as const : "info" as const,
  },
];
