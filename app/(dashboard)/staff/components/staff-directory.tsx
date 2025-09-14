"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Eye,
  RefreshCw,
  Loader2
} from "lucide-react";
import { useStaff } from "@/features/staff/context/staff-context";
import { StaffInviteDialog } from "@/features/staff/components/staff-invite-dialog";
import { AddStaffDialog } from "@/features/staff/components/add-staff-dialog";
import { getAllStaff } from "@/server/staff-invites";

// Staff data type
interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  role: "ADMIN" | "VETERINARIAN" | "WORKER";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  image?: string | null;
}

const roleColors = {
  ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  VETERINARIAN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  WORKER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

export function StaffDirectory() {
  const { setIsInviteDialogOpen, setIsAddStaffDialogOpen } = useStaff();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [staffData, setStaffData] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load staff members from database
  const loadStaffMembers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAllStaff();
      if (result.success) {
        setStaffData(result.data);
      } else {
        setError(result.message || "Failed to load staff members");
        setStaffData([]);
      }
    } catch (error) {
      console.error("Failed to load staff members:", error);
      setError("Failed to load staff members");
      setStaffData([]);
    } finally {
      setIsLoading(false);
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

  const filteredStaff = staffData.filter((staff) => {
    const matchesSearch = 
      staff.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (staff.email && staff.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === "all" || staff.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && staff.isActive) ||
      (statusFilter === "inactive" && !staff.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleEditStaff = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setIsEditDialogOpen(true);
  };

  const handleViewStaff = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setIsViewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Staff Directory</h2>
          <p className="text-muted-foreground">
            Manage your staff members and their information.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setIsAddStaffDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
          <Button onClick={() => setIsInviteDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Staff
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter staff members by role, status, or search by name/email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
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
            A list of all staff members in your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading staff members...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-red-600">
                      <p>{error}</p>
                      <Button variant="outline" onClick={handleRefresh} className="mt-2">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try Again
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <p>No staff members found</p>
                      {searchTerm || roleFilter !== "all" || statusFilter !== "all" ? (
                        <p className="text-sm">Try adjusting your filters</p>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={staff.image || ""} alt={staff.firstName} />
                          <AvatarFallback>
                            {staff.firstName.charAt(0)}{staff.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{staff.firstName} {staff.lastName}</div>
                          <div className="text-sm text-muted-foreground">{staff.email || "No email"}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleColors[staff.role as keyof typeof roleColors]}>
                        {staff.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="mr-2 h-3 w-3" />
                          {staff.email || "No email"}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="mr-2 h-3 w-3" />
                          {staff.phoneNumber || "No phone"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={staff.isActive ? "default" : "secondary"}>
                        {staff.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(staff.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewStaff(staff)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditStaff(staff)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Staff Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Staff Details</DialogTitle>
            <DialogDescription>
              View detailed information about this staff member.
            </DialogDescription>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedStaff.image || ""} alt={selectedStaff.firstName} />
                  <AvatarFallback className="text-lg">
                    {selectedStaff.firstName.charAt(0)}{selectedStaff.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedStaff.firstName} {selectedStaff.lastName}
                  </h3>
                  <Badge className={roleColors[selectedStaff.role as keyof typeof roleColors]}>
                    {selectedStaff.role}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Contact Information</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center">
                      <Mail className="mr-2 h-4 w-4" />
                      {selectedStaff.email || "No email"}
                    </div>
                    <div className="flex items-center">
                      <Phone className="mr-2 h-4 w-4" />
                      {selectedStaff.phoneNumber || "No phone"}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Account Information</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      Joined: {new Date(selectedStaff.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Shield className="mr-2 h-4 w-4" />
                      Status: {selectedStaff.isActive ? "Active" : "Inactive"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              if (selectedStaff) {
                handleEditStaff(selectedStaff);
              }
            }}>
              Edit Staff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff member information and settings.
            </DialogDescription>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  <Input defaultValue={selectedStaff.firstName} />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  <Input defaultValue={selectedStaff.lastName} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input defaultValue={selectedStaff.email || ""} type="email" />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input defaultValue={selectedStaff.phoneNumber || ""} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <Select defaultValue={selectedStaff.role}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="VETERINARIAN">Veterinarian</SelectItem>
                      <SelectItem value="WORKER">Worker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select defaultValue={selectedStaff.isActive ? "active" : "inactive"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsEditDialogOpen(false)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Components */}
      <StaffInviteDialog />
      <AddStaffDialog />
    </div>
  );
}
