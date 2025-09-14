"use client";

import { useState } from "react";
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
import { 
  Bell, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Send,
  Mail,
  User,
  Settings,
  Trash2,
  Check
} from "lucide-react";

// Mock data
const notifications = [
  {
    id: "1",
    title: "Leave Request Approved",
    message: "Your leave request for February 1-5 has been approved by John Doe.",
    type: "success",
    isRead: false,
    createdAt: "2024-01-20T10:30:00Z",
    priority: "high",
    recipient: "Jane Smith"
  },
  {
    id: "2",
    title: "Payroll Processed",
    message: "Your salary for January 2024 has been processed and will be credited to your account.",
    type: "info",
    isRead: true,
    createdAt: "2024-01-19T15:45:00Z",
    priority: "medium",
    recipient: "All Staff"
  },
  {
    id: "3",
    title: "Attendance Reminder",
    message: "Please remember to check in when you arrive at the office.",
    type: "warning",
    isRead: false,
    createdAt: "2024-01-20T08:00:00Z",
    priority: "low",
    recipient: "All Staff"
  },
  {
    id: "4",
    title: "System Maintenance",
    message: "The system will be under maintenance from 2 AM to 4 AM tomorrow.",
    type: "info",
    isRead: true,
    createdAt: "2024-01-18T16:20:00Z",
    priority: "medium",
    recipient: "All Staff"
  },
  {
    id: "5",
    title: "New Staff Member",
    message: "Welcome Sarah Wilson to our team! She joins as a Worker.",
    type: "success",
    isRead: false,
    createdAt: "2024-01-17T09:15:00Z",
    priority: "low",
    recipient: "All Staff"
  },
];

const typeColors = {
  success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const priorityColors = {
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

export function NotificationCenter() {
  const [activeTab, setActiveTab] = useState("inbox");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || notification.type === typeFilter;
    const matchesPriority = priorityFilter === "all" || notification.priority === priorityFilter;
    return matchesSearch && matchesType && matchesPriority;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const totalNotifications = notifications.length;

  const handleMarkAsRead = (notificationId: string) => {
    // Handle mark as read logic
    console.log("Marking as read:", notificationId);
  };

  const handleMarkAllAsRead = () => {
    // Handle mark all as read logic
    console.log("Marking all as read");
  };

  const handleDeleteNotification = (notificationId: string) => {
    // Handle delete logic
    console.log("Deleting notification:", notificationId);
  };

  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId) 
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notification Center</h2>
          <p className="text-muted-foreground">
            Manage notifications and communicate with staff.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <Check className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
          <Button onClick={() => setIsSendDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Send Notification
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNotifications}</div>
            <p className="text-xs text-muted-foreground">
              All notifications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Read</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalNotifications - unreadCount}</div>
            <p className="text-xs text-muted-foreground">
              Already read
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedNotifications.length}</div>
            <p className="text-xs text-muted-foreground">
              For bulk actions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Inbox Tab */}
        <TabsContent value="inbox" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Filter notifications by type, priority, or search content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search notifications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedNotifications.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {selectedNotifications.length} notification(s) selected
                  </span>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Check className="mr-2 h-4 w-4" />
                      Mark as Read
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Notifications ({filteredNotifications.length})</CardTitle>
                  <CardDescription>
                    All notifications received.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedNotifications.length === filteredNotifications.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border rounded-lg ${
                      !notification.isRead ? "bg-blue-50 border-blue-200" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={() => handleSelectNotification(notification.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <h3 className={`text-sm font-medium ${!notification.isRead ? "font-semibold" : ""}`}>
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={typeColors[notification.type as keyof typeof typeColors]}>
                              {notification.type}
                            </Badge>
                            <Badge className={priorityColors[notification.priority as keyof typeof priorityColors]}>
                              {notification.priority}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>To: {notification.recipient}</span>
                            <span>{new Date(notification.createdAt).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteNotification(notification.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sent Tab */}
        <TabsContent value="sent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sent Notifications</CardTitle>
              <CardDescription>
                Notifications you have sent to staff members.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Send className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No sent notifications</h3>
                <p className="text-muted-foreground">
                  Notifications you send will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Templates</CardTitle>
              <CardDescription>
                Pre-defined notification templates for common messages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium">Welcome Message</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Welcome to our team! We're excited to have you on board.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Use Template
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium">Leave Reminder</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Don't forget to submit your leave requests in advance.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Use Template
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium">Payroll Notification</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your salary has been processed and will be credited soon.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Use Template
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium">System Maintenance</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    The system will be under maintenance during the specified time.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Use Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure notification preferences and delivery methods.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Email Notifications</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Send email for important notifications</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Send email for leave requests</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" />
                    <span className="text-sm">Send email for attendance reminders</span>
                  </label>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-medium">In-App Notifications</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Show desktop notifications</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Play sound for new notifications</span>
                  </label>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-medium">Auto-Delete</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" />
                    <span className="text-sm">Auto-delete read notifications after 30 days</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Send Notification Dialog */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>
              Send a notification to staff members.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Recipients</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    <SelectItem value="admins">Admins Only</SelectItem>
                    <SelectItem value="veterinarians">Veterinarians Only</SelectItem>
                    <SelectItem value="workers">Workers Only</SelectItem>
                    <SelectItem value="custom">Custom Selection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input placeholder="Enter notification title" />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea placeholder="Enter notification message" rows={4} />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="send-email" />
              <label htmlFor="send-email" className="text-sm">
                Also send as email
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsSendDialogOpen(false)}>
              <Send className="mr-2 h-4 w-4" />
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
