"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  User,
  Plus
} from "lucide-react";

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  role: string;
  isSystemUser: boolean;
  isActive: boolean;
  createdAt: string;
}

interface InviteSentTableProps {
  staffMembers: StaffMember[];
  onRefresh: () => void;
  onCreateStaff: (data: any) => void;
  onSendInvite: () => void;
  isLoading?: boolean;
}

const roleColors = {
  ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  VETERINARIAN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  WORKER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

const getStaffTypeColor = (isSystemUser: boolean) => {
  return isSystemUser 
    ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
    : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
};

export function InviteSentTable({ staffMembers, onRefresh, onCreateStaff, onSendInvite, isLoading = false }: InviteSentTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    role: "WORKER",
    isSystemUser: false
  });

  const filteredStaff = staffMembers.filter((staff) => {
    const matchesSearch = 
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.phoneNumber?.includes(searchTerm);
    const matchesRole = roleFilter === "all" || staff.role === roleFilter;
    const matchesType = typeFilter === "all" || 
      (typeFilter === "SYSTEM_USER" && staff.isSystemUser) ||
      (typeFilter === "NON_SYSTEM_USER" && !staff.isSystemUser);
    return matchesSearch && matchesRole && matchesType;
  });

  const staffStats = {
    total: staffMembers.length,
    systemUsers: staffMembers.filter(s => s.isSystemUser).length,
    nonSystemUsers: staffMembers.filter(s => !s.isSystemUser).length,
    active: staffMembers.filter(s => s.isActive).length,
    inactive: staffMembers.filter(s => !s.isActive).length
  };

  const handleCreateStaff = () => {
    if (!formData.firstName || !formData.lastName) {
      alert("First name and last name are required");
      return;
    }

    if (formData.isSystemUser && !formData.email) {
      alert("Email is required for system users");
      return;
    }

    onCreateStaff(formData);
    setIsCreateDialogOpen(false);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      role: "WORKER",
      isSystemUser: false
    });
  };

  const handleStaffTypeChange = (isSystemUser: boolean) => {
    setFormData(prev => ({
      ...prev,
      isSystemUser,
      role: isSystemUser ? "ADMIN" : "WORKER"
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Staff Directory</h2>
          <p className="text-muted-foreground">
            Manage all staff members including system and non-system users.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={onSendInvite}>
            <Mail className="mr-2 h-4 w-4" />
            Send Invite
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffStats.total}</div>
            <p className="text-xs text-muted-foreground">
              All staff members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Users</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{staffStats.systemUsers}</div>
            <p className="text-xs text-muted-foreground">
              Admin & Veterinarians
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-System Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{staffStats.nonSystemUsers}</div>
            <p className="text-xs text-muted-foreground">
              Workers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{staffStats.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{staffStats.inactive}</div>
            <p className="text-xs text-muted-foreground">
              Not active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter staff members by role, type, or search by name, email, or phone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="SYSTEM_USER">System Users</SelectItem>
                <SelectItem value="NON_SYSTEM_USER">Non-System Users</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members ({filteredStaff.length})</CardTitle>
          <CardDescription>
            All staff members in the system with their roles and types.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Loading staff members...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      No staff members found. Add some staff members to get started.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">{staff.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {staff.email && (
                          <div className="text-sm text-muted-foreground">{staff.email}</div>
                        )}
                        {staff.phoneNumber && (
                          <div className="text-sm text-muted-foreground">{staff.phoneNumber}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleColors[staff.role as keyof typeof roleColors]}>
                        {staff.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStaffTypeColor(staff.isSystemUser)}>
                        {staff.isSystemUser ? "System User" : "Non-System User"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={staff.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {staff.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span className="text-sm">
                          {new Date(staff.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <User className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Staff Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>
              Add a new staff member to the system. Choose between system user (requires email) or non-system user (worker).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">First Name <span className="text-red-500">*</span></label>
                <Input 
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name <span className="text-red-500">*</span></label>
                <Input 
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Doe"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Staff Type <span className="text-red-500">*</span></label>
              <Select value={formData.isSystemUser ? "SYSTEM_USER" : "NON_SYSTEM_USER"} onValueChange={(value) => handleStaffTypeChange(value === "SYSTEM_USER")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SYSTEM_USER">System User (Admin/Vet) - Requires Email</SelectItem>
                  <SelectItem value="NON_SYSTEM_USER">Non-System User (Worker) - No Email Required</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Role <span className="text-red-500">*</span></label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formData.isSystemUser ? (
                    <>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="VETERINARIAN">Veterinarian</SelectItem>
                    </>
                  ) : (
                    <SelectItem value="WORKER">Worker</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">
                Email {formData.isSystemUser ? <span className="text-red-500">*</span> : ""}
              </label>
              <Input 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="staff@company.com"
                disabled={!formData.isSystemUser}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Phone Number</label>
              <Input 
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="+1234567890"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateStaff}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Staff Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
