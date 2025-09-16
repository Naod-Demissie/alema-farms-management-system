"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity,
  Bird,
  Egg,
  Users,
  Heart,
  Utensils,
  DollarSign,
  ArrowRight,
  Filter,
  RefreshCw,
  Clock,
  Eye
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: number;
  action: string;
  time: string;
  type: string;
  icon: any;
  details?: string;
  status?: "success" | "warning" | "error" | "info";
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  onRefresh?: () => void;
  onViewAll?: () => void;
}

export function ActivityFeed({ activities, onRefresh, onViewAll }: ActivityFeedProps) {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const getActivityIcon = (type: string) => {
    const iconMap: { [key: string]: any } = {
      flock: Bird,
      production: Egg,
      staff: Users,
      health: Heart,
      feed: Utensils,
      financial: DollarSign,
    };
    return iconMap[type] || Activity;
  };

  const getStatusColor = (status?: string) => {
    const colorMap: { [key: string]: string } = {
      success: "text-green-600 bg-green-50 border-green-200",
      warning: "text-yellow-600 bg-yellow-50 border-yellow-200",
      error: "text-red-600 bg-red-50 border-red-200",
      info: "text-blue-600 bg-blue-50 border-blue-200",
    };
    return colorMap[status || "info"] || "text-gray-600 bg-gray-50 border-gray-200";
  };

  const filteredActivities = activities.filter(activity => {
    const matchesFilter = filter === "all" || activity.type === filter;
    const matchesSearch = activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.details?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest updates and activities across your farm
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="flock">Flock</SelectItem>
              <SelectItem value="production">Production</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="health">Health</SelectItem>
              <SelectItem value="feed">Feed</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activity List */}
        <div className="space-y-3">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <div
                  key={activity.id}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group",
                    activity.status && getStatusColor(activity.status)
                  )}
                >
                  <div className="p-2 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{activity.action}</p>
                      <div className="flex items-center space-x-2">
                        {activity.status && (
                          <Badge variant="outline" className="text-xs">
                            {activity.status}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {activity.time}
                        </span>
                      </div>
                    </div>
                    {activity.details && (
                      <p className="text-xs text-muted-foreground mt-1">{activity.details}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No activities found</h3>
              <p className="text-muted-foreground">
                {searchQuery || filter !== "all" 
                  ? "Try adjusting your filters or search terms"
                  : "No recent activities to display"
                }
              </p>
            </div>
          )}
        </div>

        {/* View All Button */}
        {filteredActivities.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="w-full" onClick={onViewAll}>
              View All Activity
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
