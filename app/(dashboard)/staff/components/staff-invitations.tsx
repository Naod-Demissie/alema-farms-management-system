"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  UserPlus, 
  Mail, 
  Search, 
  Filter, 
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  Send,
  Copy,
  Eye,
  Calendar,
  User
} from "lucide-react";
import { InviteSentTable } from "./invite-sent-table";
import { createNonSystemStaff, getAllStaff, createInvite } from "@/server/staff-invites";
import { useSession } from "@/lib/auth-client";

// Mock data
const invitations = [
  {
    id: "1",
    email: "new.staff@company.com",
    role: "WORKER",
    status: "Pending",
    sentDate: "2024-01-20T10:30:00Z",
    expiresAt: "2024-01-27T10:30:00Z",
    sentBy: "John Doe",
    token: "inv_abc123def456"
  },
  {
    id: "2",
    email: "vet.candidate@company.com",
    role: "VETERINARIAN",
    status: "Accepted",
    sentDate: "2024-01-18T14:20:00Z",
    expiresAt: "2024-01-25T14:20:00Z",
    sentBy: "Jane Smith",
    token: "inv_xyz789uvw012"
  },
  {
    id: "3",
    email: "admin.new@company.com",
    role: "ADMIN",
    status: "Expired",
    sentDate: "2024-01-10T09:15:00Z",
    expiresAt: "2024-01-17T09:15:00Z",
    sentBy: "Mike Johnson",
    token: "inv_mno345pqr678"
  },
  {
    id: "4",
    email: "worker.new@company.com",
    role: "WORKER",
    status: "Cancelled",
    sentDate: "2024-01-15T16:45:00Z",
    expiresAt: "2024-01-22T16:45:00Z",
    sentBy: "Sarah Wilson",
    token: "inv_stu901vwx234"
  },
];

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Accepted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Expired: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  Cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

const roleColors = {
  ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  VETERINARIAN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  WORKER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

export function StaffInvitations() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("invitations");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isResendDialogOpen, setIsResendDialogOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<any>(null);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    email: "",
    role: "ADMIN" as "ADMIN" | "VETERINARIAN" | "WORKER"
  });

  const filteredInvitations = invitations.filter((invitation) => {
    const matchesSearch = invitation.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invitation.status === statusFilter;
    const matchesRole = roleFilter === "all" || invitation.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const invitationStats = {
    total: invitations.length,
    pending: invitations.filter(i => i.status === "Pending").length,
    accepted: invitations.filter(i => i.status === "Accepted").length,
    expired: invitations.filter(i => i.status === "Expired").length,
    cancelled: invitations.filter(i => i.status === "Cancelled").length
  };

  const handleResendInvitation = (invitation: any) => {
    setSelectedInvitation(invitation);
    setIsResendDialogOpen(true);
  };

  const handleCancelInvitation = (invitationId: string) => {
    // Handle cancel logic
    console.log("Cancelling invitation:", invitationId);
  };

  const handleCopyInviteLink = (token: string) => {
    const inviteLink = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(inviteLink);
    // Show toast notification
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  // Load staff members
  const loadStaffMembers = async () => {
    setIsLoading(true);
    try {
      const result = await getAllStaff();
      if (result.success) {
        setStaffMembers(result.data);
      } else {
        console.error("Failed to load staff members:", result.message);
        setStaffMembers([]);
      }
    } catch (error) {
      console.error("Failed to load staff members:", error);
      setStaffMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Create staff member
  const handleCreateStaff = async (data: any) => {
    try {
      const result = await createNonSystemStaff(data);
      
      if (result.success) {
        setStaffMembers(prev => [result.data, ...prev]);
        alert('Staff member created successfully!');
      } else {
        alert(`Failed to create staff member: ${result.message}`);
      }
    } catch (error) {
      console.error("Failed to create staff member:", error);
      alert(`Failed to create staff member: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle send invite
  const handleSendInvite = async () => {
    try {
      if (!session?.user?.id) {
        alert('You must be logged in to send invitations');
        return;
      }
      
      const inviteData = {
        ...inviteFormData,
        createdById: session.user.id
      };
      
      const result = await createInvite(inviteData);
      
      if (result.success) {
        alert('Invitation sent successfully!');
        setIsSendDialogOpen(false);
        setInviteFormData({ email: "", role: "ADMIN" });
      } else {
        alert(`Failed to send invitation: ${result.message}`);
      }
    } catch (error) {
      console.error("Failed to send invitation:", error);
      alert(`Failed to send invitation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    loadStaffMembers();
  };

  // Load data on component mount
  useEffect(() => {
    loadStaffMembers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Staff Invitations</h2>
          <p className="text-muted-foreground">
            Manage staff invitations and onboarding process.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setIsSendDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Send Invitation
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invitationStats.total}</div>
            <p className="text-xs text-muted-foreground">
              All invitations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{invitationStats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{invitationStats.accepted}</div>
            <p className="text-xs text-muted-foreground">
              Successfully joined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{invitationStats.expired}</div>
            <p className="text-xs text-muted-foreground">
              No longer valid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{invitationStats.cancelled}</div>
            <p className="text-xs text-muted-foreground">
              Manually cancelled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="staff-directory">Staff Directory</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Filter invitations by status, role, or search by email.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by email..."
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
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Accepted">Accepted</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="VETERINARIAN">Veterinarian</SelectItem>
                    <SelectItem value="WORKER">Worker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Invitations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Invitations ({filteredInvitations.length})</CardTitle>
              <CardDescription>
                All staff invitations sent and their current status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent Date</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Sent By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">{invitation.email}</TableCell>
                      <TableCell>
                        <Badge className={roleColors[invitation.role as keyof typeof roleColors]}>
                          {invitation.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge className={statusColors[invitation.status as keyof typeof statusColors]}>
                            {invitation.status}
                          </Badge>
                          {isExpired(invitation.expiresAt) && invitation.status === "Pending" && (
                            <Badge variant="destructive">Expired</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(invitation.sentDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span className="text-sm">
                            {new Date(invitation.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{invitation.sentBy}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyInviteLink(invitation.token)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {invitation.status === "Pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResendInvitation(invitation)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {invitation.status === "Pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelInvitation(invitation.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Directory Tab */}
        <TabsContent value="staff-directory" className="space-y-6">
          <InviteSentTable 
            staffMembers={staffMembers}
            onRefresh={handleRefresh}
            onCreateStaff={handleCreateStaff}
            onSendInvite={() => setIsSendDialogOpen(true)}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invitation Templates</CardTitle>
              <CardDescription>
                Pre-defined invitation templates for different roles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium">Admin Invitation</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Welcome to our team as an Administrator. You'll have full access to manage the system.
                  </p>
                  <div className="mt-3 flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Use Template
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium">Veterinarian Invitation</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Join our veterinary team and help us provide the best care for our animals.
                  </p>
                  <div className="mt-3 flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Use Template
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium">Worker Invitation</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Welcome to our operations team. You'll be responsible for daily farm operations.
                  </p>
                  <div className="mt-3 flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Use Template
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium">Custom Template</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create your own custom invitation template for specific needs.
                  </p>
                  <div className="mt-3 flex space-x-2">
                    <Button variant="outline" size="sm">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create New
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invitation Settings</CardTitle>
              <CardDescription>
                Configure invitation preferences and expiration settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Expiration Settings</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Expiration Time</label>
                  <Select defaultValue="7days">
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1day">1 Day</SelectItem>
                      <SelectItem value="3days">3 Days</SelectItem>
                      <SelectItem value="7days">7 Days</SelectItem>
                      <SelectItem value="14days">14 Days</SelectItem>
                      <SelectItem value="30days">30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Email Settings</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Send email notifications for invitations</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Send reminder emails before expiration</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" />
                    <span className="text-sm">Send follow-up emails for pending invitations</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Auto-cleanup</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" />
                    <span className="text-sm">Auto-delete expired invitations after 30 days</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" />
                    <span className="text-sm">Auto-cancel invitations older than 14 days</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Send Invitation Dialog */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Staff Invitation</DialogTitle>
            <DialogDescription>
              Invite a new system user (Admin/Vet) to join your organization. For workers, use the Staff Directory tab.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email Address *</label>
                <Input 
                  type="email" 
                  placeholder="staff@company.com"
                  value={inviteFormData.email}
                  onChange={(e) => setInviteFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role *</label>
                <Select 
                  value={inviteFormData.role}
                  onValueChange={(value) => setInviteFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="VETERINARIAN">Veterinarian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Expiration Time</label>
              <Select defaultValue="7days">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1day">1 Day</SelectItem>
                  <SelectItem value="3days">3 Days</SelectItem>
                  <SelectItem value="7days">7 Days</SelectItem>
                  <SelectItem value="14days">14 Days</SelectItem>
                  <SelectItem value="30days">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Custom Message (Optional)</label>
              <Textarea 
                placeholder="Add a personal message to the invitation..." 
                rows={3}
              />
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> This invitation is for system users only (Admin/Vet). 
                For workers who don't need system access, use the "Add Staff" button in the Staff Directory tab.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendInvite}>
              <Send className="mr-2 h-4 w-4" />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resend Invitation Dialog */}
      <Dialog open={isResendDialogOpen} onOpenChange={setIsResendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resend Invitation</DialogTitle>
            <DialogDescription>
              Resend the invitation to {selectedInvitation?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Expiration Time</label>
              <Select defaultValue="7days">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1day">1 Day</SelectItem>
                  <SelectItem value="3days">3 Days</SelectItem>
                  <SelectItem value="7days">7 Days</SelectItem>
                  <SelectItem value="14days">14 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Additional Message (Optional)</label>
              <Textarea 
                placeholder="Add a note for the recipient..." 
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResendDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsResendDialogOpen(false)}>
              <Send className="mr-2 h-4 w-4" />
              Resend Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
