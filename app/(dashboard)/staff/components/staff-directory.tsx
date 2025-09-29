"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  UserPlus,
  RefreshCw,
  Loader2,
  Mail
} from "lucide-react";
import { useStaff } from "@/features/staff/context/staff-context";
import { StaffInviteDialog } from "@/features/staff/components/staff-invite-dialog";
import { AddStaffDialog } from "@/features/staff/components/add-staff-dialog";
import { updateStaff, deleteStaff } from "@/server/staff";
import { getAllStaff, getAllInvites, resendInvite, cancelInvite } from "@/server/staff-invites";
import { StaffTable } from "@/features/staff/components/staff-table";
import { InviteTable } from "@/features/staff/components/invite-table";
import { createStaffDirectoryColumns } from "./staff-directory-columns";
import { createInviteSentColumns } from "./invite-sent-columns";
import { Staff } from "@/features/staff/data/schema";
import { Invite, computeInviteStatus } from "@/features/staff/data/invite-schema";
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
import { Mail as MailIcon, Phone, Calendar, Shield, Copy, Send, XCircle } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";

const editStaffFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().optional(),
  isActive: z.boolean(),
});

type EditStaffFormValues = z.infer<typeof editStaffFormSchema>;

const roleColors = {
  ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  VETERINARIAN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  WORKER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

export function StaffDirectory() {
  const { setIsInviteDialogOpen, setIsAddStaffDialogOpen, setRefreshInvites, setRefreshStaff } = useStaff();
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [staffData, setStaffData] = useState<Staff[]>([]);
  const [inviteData, setInviteData] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteLoading, setIsInviteLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("staff");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'resend' | 'cancel' | 'delete' | null;
    invite?: Invite | null;
    staff?: Staff | null;
  }>({
    open: false,
    type: null,
    invite: null,
    staff: null,
  });

  const editForm = useForm<EditStaffFormValues>({
    resolver: zodResolver(editStaffFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      isActive: true,
    },
  });

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

  // Load invites from database
  const loadInvites = async () => {
    setIsInviteLoading(true);
    setInviteError(null);
    try {
      const result = await getAllInvites();
      if (result.success) {
        setInviteData(result.data);
      } else {
        setInviteError(result.message || "Failed to load invites");
        setInviteData([]);
        toast.error("Failed to load invites", {
          description: result.message || "Unable to fetch invitation data",
        });
      }
    } catch (error) {
      console.error("Failed to load invites:", error);
      setInviteError("Failed to load invites");
      setInviteData([]);
      toast.error("Failed to load invites", {
        description: "An unexpected error occurred while loading invitation data",
      });
    } finally {
      setIsInviteLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    await Promise.all([loadStaffMembers(), loadInvites()]);
    toast.success("Data refreshed successfully!", {
      description: "Staff members and invitations have been updated",
    });
  };

  // Load data on component mount
  useEffect(() => {
    loadStaffMembers();
    loadInvites();
  }, []);

  // Register refresh functions with context
  useEffect(() => {
    setRefreshInvites(() => loadInvites);
    setRefreshStaff(() => loadStaffMembers);
  }, [setRefreshInvites, setRefreshStaff]);

  const handleEditStaff = (staff: Staff) => {
    setSelectedStaff(staff);
    editForm.reset({
      firstName: staff.firstName,
      lastName: staff.lastName,
      phoneNumber: staff.phoneNumber || "",
      isActive: staff.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (data: EditStaffFormValues) => {
    if (!selectedStaff) return;
    
    setIsEditLoading(true);
    try {
      const result = await updateStaff(selectedStaff.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber || "",
        isActive: data.isActive,
      });

      if (result.success) {
        // Update the staff in the list immediately
        setStaffData(prevStaff => 
          prevStaff.map(s => 
            s.id === selectedStaff.id 
              ? { ...s, ...data, updatedAt: new Date() }
              : s
          )
        );
        // Also refresh from server to ensure data consistency
        await loadStaffMembers();
        toast.success("Staff member updated successfully!", {
          description: `${data.firstName} ${data.lastName} has been updated`,
        });
        setIsEditDialogOpen(false);
      } else {
        toast.error("Failed to update staff member", {
          description: result.message || "An unexpected error occurred",
        });
      }
    } catch (error) {
      console.error("Failed to update staff:", error);
      toast.error("Failed to update staff member", {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleViewStaff = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsViewDialogOpen(true);
  };

  const handleDeleteStaff = (staff: Staff) => {
    setConfirmDialog({
      open: true,
      type: 'delete',
      staff,
    });
  };

  // Invite management functions
  const handleResendInvite = (invite: Invite) => {
    setConfirmDialog({
      open: true,
      type: 'resend',
      invite,
    });
  };

  const handleCancelInvite = (invite: Invite) => {
    setConfirmDialog({
      open: true,
      type: 'cancel',
      invite,
    });
  };

  const executeResendInvite = async (invite: Invite) => {
    setActionLoading(invite.id);
    try {
      const result = await resendInvite(invite.id);
      if (result.success) {
        // Update the invite data immediately with the new data from server
        if (result.data) {
          setInviteData(prevInvites => 
            prevInvites.map(inv => 
              inv.id === invite.id ? { ...inv, ...result.data, updatedAt: new Date() } : inv
            )
          );
        }
        toast.success("Invitation resent successfully!", {
          description: `A new invitation has been sent to ${invite.email}`,
        });
      } else {
        console.error("Failed to resend invite:", result.message);
        toast.error("Failed to resend invitation", {
          description: result.message || "An unexpected error occurred",
        });
      }
    } catch (error) {
      console.error("Failed to resend invite:", error);
      toast.error("Failed to resend invitation", {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const executeCancelInvite = async (invite: Invite) => {
    setActionLoading(invite.id);
    try {
      const result = await cancelInvite(invite.id);
      if (result.success) {
        // Remove the invite from the list immediately
        setInviteData(prevInvites => 
          prevInvites.filter(inv => inv.id !== invite.id)
        );
        toast.success("Invitation cancelled successfully!", {
          description: `The invitation for ${invite.email} has been cancelled`,
        });
      } else {
        console.error("Failed to cancel invite:", result.message);
        toast.error("Failed to cancel invitation", {
          description: result.message || "An unexpected error occurred",
        });
      }
    } catch (error) {
      console.error("Failed to cancel invite:", error);
      toast.error("Failed to cancel invitation", {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const executeDeleteStaff = async (staff: Staff) => {
    setActionLoading(staff.id);
    try {
      const result = await deleteStaff(staff.id);
      if (result.success) {
        // Remove the staff from the list immediately
        setStaffData(prevStaff => 
          prevStaff.filter(s => s.id !== staff.id)
        );
        // Also refresh from server to ensure data consistency
        await loadStaffMembers();
        toast.success("Staff member deleted successfully!", {
          description: `${staff.firstName} ${staff.lastName} has been removed from the system`,
        });
      } else {
        console.error("Failed to delete staff:", result.message);
        toast.error("Failed to delete staff member", {
          description: result.message || "An unexpected error occurred",
        });
      }
    } catch (error) {
      console.error("Failed to delete staff:", error);
      toast.error("Failed to delete staff member", {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.type) return;

    if (confirmDialog.type === 'resend' && confirmDialog.invite) {
      await executeResendInvite(confirmDialog.invite);
    } else if (confirmDialog.type === 'cancel' && confirmDialog.invite) {
      await executeCancelInvite(confirmDialog.invite);
    } else if (confirmDialog.type === 'delete' && confirmDialog.staff) {
      await executeDeleteStaff(confirmDialog.staff);
    }

    setConfirmDialog({
      open: false,
      type: null,
      invite: null,
      staff: null,
    });
  };

  const handleCopyInviteLink = async (invite: Invite) => {
    try {
      const inviteLink = `${window.location.origin}/complete-registration?token=${invite.token}&email=${encodeURIComponent(invite.email)}`;
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied!", {
        description: `The invitation link for ${invite.email} has been copied to clipboard`,
      });
    } catch (error) {
      console.error("Failed to copy invite link:", error);
      toast.error("Failed to copy invite link", {
        description: "Unable to copy the invitation link to clipboard",
      });
    }
  };

  // Create columns with handlers
  const staffColumns = createStaffDirectoryColumns({
    onEdit: handleEditStaff,
    onView: handleViewStaff,
    onDelete: handleDeleteStaff,
  });

  const inviteColumns = createInviteSentColumns({
    onResend: handleResendInvite,
    onCancel: handleCancelInvite,
    onCopyLink: handleCopyInviteLink,
    actionLoading,
  });

  // Faceted filter options for staff
  const staffFacetedFilters = [
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

  // Faceted filter options for invites
  const inviteFacetedFilters = [
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
      columnId: "status",
      title: "Status",
      options: [
        { label: "Pending", value: "PENDING" },
        { label: "Accepted", value: "ACCEPTED" },
        { label: "Expired", value: "EXPIRED" },
        { label: "Cancelled", value: "CANCELLED" },
      ],
    },
  ];

  // Calculate invite stats
  const inviteStats = {
    total: inviteData.length,
    pending: inviteData.filter(invite => computeInviteStatus(invite) === "PENDING").length,
    accepted: inviteData.filter(invite => computeInviteStatus(invite) === "ACCEPTED").length,
    expired: inviteData.filter(invite => computeInviteStatus(invite) === "EXPIRED").length,
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Staff Directory</h2>
        <p className="text-muted-foreground">
          Manage your staff members and their information.
        </p>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="staff">Staff Members</TabsTrigger>
          <TabsTrigger value="invites">Invite Sent</TabsTrigger>
        </TabsList>

        {/* Staff Members Tab */}
        <TabsContent value="staff" className="space-y-6">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading staff members...</span>
                </div>
              </CardContent>
            </Card>
          ) : error ? (
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
          ) : (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Staff Members ({staffData.length})</CardTitle>
              <CardDescription>
                A list of all staff members in your organization.
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddStaffDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <StaffTable 
                  columns={staffColumns} 
            data={staffData}
          />
        </CardContent>
      </Card>
          )}
        </TabsContent>

        {/* Invite Sent Tab */}
        <TabsContent value="invites" className="space-y-6">
          {/* Invite Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inviteStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  All invitations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{inviteStats.pending}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting response
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Accepted</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{inviteStats.accepted}</div>
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
                <div className="text-2xl font-bold text-red-600">{inviteStats.expired}</div>
                <p className="text-xs text-muted-foreground">
                  No longer valid
                </p>
              </CardContent>
            </Card>
          </div>

          {isInviteLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading invites...</span>
                </div>
              </CardContent>
            </Card>
          ) : inviteError ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <p className="text-red-600 mb-4">{inviteError}</p>
                  <Button variant="outline" onClick={handleRefresh}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>Invitations Sent ({inviteData.length})</CardTitle>
                    <CardDescription>
                      All staff invitations sent and their current status.
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsInviteDialogOpen(true)}>
                    <Mail className="h-4 w-4 mr-2" />
                    Invite Staff
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <InviteTable 
                  columns={inviteColumns} 
                  data={inviteData}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input value={selectedStaff.email || ""} disabled />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>
                
                <FormField
                  control={editForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+1234567890" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <Input value={selectedStaff.role} disabled />
                    <p className="text-xs text-muted-foreground mt-1">Role cannot be changed</p>
                  </div>
                  <FormField
                    control={editForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <Select 
                            value={field.value ? "active" : "inactive"}
                            onValueChange={(value) => field.onChange(value === "active")}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                    disabled={isEditLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isEditLoading}>
                    {isEditLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Components */}
      <StaffInviteDialog />
      <AddStaffDialog />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={
          confirmDialog.type === 'resend' 
            ? 'Resend Invitation' 
            : confirmDialog.type === 'cancel' 
            ? 'Cancel Invitation' 
            : confirmDialog.type === 'delete'
            ? 'Delete Staff Member'
            : 'Confirm Action'
        }
        desc={
          confirmDialog.type === 'resend' 
            ? `Are you sure you want to resend the invitation to ${confirmDialog.invite?.email}? A new invitation email will be sent with a fresh expiration date.`
            : confirmDialog.type === 'cancel'
            ? `Are you sure you want to cancel the invitation for ${confirmDialog.invite?.email}? This action cannot be undone.`
            : confirmDialog.type === 'delete'
            ? `Are you sure you want to delete ${confirmDialog.staff?.firstName} ${confirmDialog.staff?.lastName}? This action cannot be undone and all associated data will be permanently removed.`
            : 'Are you sure you want to proceed?'
        }
        confirmText={
          confirmDialog.type === 'resend' 
            ? 'Resend Invitation' 
            : confirmDialog.type === 'cancel' 
            ? 'Cancel Invitation' 
            : confirmDialog.type === 'delete'
            ? 'Delete Staff Member'
            : 'Continue'
        }
        cancelBtnText="Cancel"
        destructive={confirmDialog.type === 'cancel' || confirmDialog.type === 'delete'}
        handleConfirm={handleConfirmAction}
        isLoading={actionLoading === (confirmDialog.invite?.id || confirmDialog.staff?.id)}
      />
    </div>
  );
}