"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  UserPlus,
  RefreshCw,
  Loader2
} from "lucide-react";
import { useStaff } from "@/features/staff/context/staff-context";
import { StaffInviteDialog } from "@/features/staff/components/staff-invite-dialog";
import { AddStaffDialog } from "@/features/staff/components/add-staff-dialog";
import { getAllStaff } from "@/server/staff-invites";
import { StaffTable } from "@/features/staff/components/staff-table";
import { createStaffDirectoryColumns } from "./staff-directory-columns";
import { Staff } from "@/features/staff/data/schema";
import { DataTableToolbar } from "@/components/table/data-table-toolbar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, Calendar, Shield } from "lucide-react";

const roleColors = {
  ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  VETERINARIAN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  WORKER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

export function StaffDirectory() {
  const { setIsInviteDialogOpen, setIsAddStaffDialogOpen } = useStaff();
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [staffData, setStaffData] = useState<Staff[]>([]);
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

  const handleEditStaff = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsEditDialogOpen(true);
  };

  const handleViewStaff = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsViewDialogOpen(true);
  };

  const handleDeleteStaff = (staff: Staff) => {
    // TODO: Implement delete functionality
    console.log("Delete staff:", staff);
  };

  // Create columns with handlers
  const columns = createStaffDirectoryColumns({
    onEdit: handleEditStaff,
    onView: handleViewStaff,
    onDelete: handleDeleteStaff,
  });

  // Faceted filter options
  const facetedFilters = [
    {
      columnId: "role",
      title: "Role",
      options: [
        { label: "Admin", value: "ADMIN" },
        { label: "Veterinarian", value: "VETERINARIAN" },
        { label: "Worker", value: "WORKER" },
      ],
    },
    {
      columnId: "isActive",
      title: "Status",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Staff Directory</h2>
            <p className="text-muted-foreground">
              Manage your staff members and their information.
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading staff members...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Staff Directory</h2>
            <p className="text-muted-foreground">
              Manage your staff members and their information.
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members ({staffData.length})</CardTitle>
          <CardDescription>
            A list of all staff members in your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StaffTable 
            columns={columns} 
            data={staffData}
          />
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