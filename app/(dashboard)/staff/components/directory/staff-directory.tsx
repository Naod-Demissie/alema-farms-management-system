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
import { useStaff } from "../../context/staff-context";
import { StaffInviteDialog } from "../invitations/staff-invite-dialog";
import { AddStaffDialog } from "./add-staff-dialog-wrapper";
import { EditStaffDialog } from "@/app/(dashboard)/staff/components/directory/edit-staff-dialog";
import { updateStaff, deleteStaff } from "@/app/(dashboard)/staff/server/staff";
import { getAllStaff, getAllInvites, resendInvite, cancelInvite } from "@/app/(dashboard)/staff/server/staff-invites";
import { StaffTable } from "./staff-table";
import { InviteTable } from "../invitations/invite-table";
import { createStaffDirectoryColumns } from "./staff-directory-columns";
import { createInviteSentColumns } from "../invitations/invite-sent-columns";
import { Staff } from "../../types/schema";
import { Invite, computeInviteStatus } from "../../types/invite-schema";
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
import { useTranslations } from 'next-intl';

// Edit staff form types (now handled by reusable component)
type EditStaffFormValues = {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  image?: string;
  isActive: boolean;
};

const roleColors = {
  ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  VETERINARIAN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  WORKER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

export function StaffDirectory() {
  const t = useTranslations('staff');
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

  // Edit form is now handled by the reusable EditStaffDialog component

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
    toast.success(t('directory.toasts.dataRefreshed'), {
      description: t('directory.toasts.dataRefreshedDescription'),
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
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (data: EditStaffFormValues) => {
    if (!selectedStaff) return;
    
    setIsEditLoading(true);
    try {
      const result = await updateStaff(selectedStaff.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber || "",
        image: data.image || "",
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
        toast.success(t('directory.toasts.staffUpdated'), {
          description: t('directory.toasts.staffUpdatedDescription', { name: `${data.firstName} ${data.lastName}` }),
        });
        setIsEditDialogOpen(false);
      } else {
        toast.error(t('directory.toasts.staffUpdateFailed'), {
          description: result.message || "An unexpected error occurred",
        });
      }
    } catch (error) {
      console.error("Failed to update staff:", error);
      toast.error(t('directory.toasts.staffUpdateFailed'), {
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
        toast.success(t('directory.toasts.inviteResent'), {
          description: t('directory.toasts.inviteResentDescription', { email: invite.email }),
        });
      } else {
        console.error("Failed to resend invite:", result.message);
        toast.error(t('directory.toasts.inviteResendFailed'), {
          description: result.message || "An unexpected error occurred",
        });
      }
    } catch (error) {
      console.error("Failed to resend invite:", error);
      toast.error(t('directory.toasts.inviteResendFailed'), {
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
        toast.success(t('directory.toasts.inviteCancelled'), {
          description: t('directory.toasts.inviteCancelledDescription', { email: invite.email }),
        });
      } else {
        console.error("Failed to cancel invite:", result.message);
        toast.error(t('directory.toasts.inviteCancelFailed'), {
          description: result.message || "An unexpected error occurred",
        });
      }
    } catch (error) {
      console.error("Failed to cancel invite:", error);
      toast.error(t('directory.toasts.inviteCancelFailed'), {
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
        toast.success(t('directory.toasts.staffDeleted'), {
          description: t('directory.toasts.staffDeletedDescription', { name: `${staff.firstName} ${staff.lastName}` }),
        });
      } else {
        console.error("Failed to delete staff:", result.message);
        toast.error(t('directory.toasts.staffDeleteFailed'), {
          description: result.message || "An unexpected error occurred",
        });
      }
    } catch (error) {
      console.error("Failed to delete staff:", error);
      toast.error(t('directory.toasts.staffDeleteFailed'), {
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
      toast.success(t('directory.toasts.linkCopied'), {
        description: t('directory.toasts.linkCopiedDescription', { email: invite.email }),
      });
    } catch (error) {
      console.error("Failed to copy invite link:", error);
      toast.error(t('directory.toasts.linkCopyFailed'), {
        description: t('directory.toasts.linkCopyFailedDescription'),
      });
    }
  };

  // Create columns with handlers
  const staffColumns = createStaffDirectoryColumns({
    onEdit: handleEditStaff,
    onView: handleViewStaff,
    onDelete: handleDeleteStaff,
    t,
  });

  const inviteColumns = createInviteSentColumns({
    onResend: handleResendInvite,
    onCancel: handleCancelInvite,
    onCopyLink: handleCopyInviteLink,
    actionLoading,
    t,
  });

  // Faceted filter options for staff
  const staffFacetedFilters = [
    {
      columnId: "role",
      title: t('directory.filters.role'),
      options: [
        { label: t('directory.roles.admin'), value: "ADMIN" },
        { label: t('directory.roles.veterinarian'), value: "VETERINARIAN" },
        { label: t('directory.roles.worker'), value: "WORKER" },
      ],
    },
    {
      columnId: "isActive",
      title: t('directory.filters.status'),
      options: [
        { label: t('directory.filterOptions.active'), value: "active" },
        { label: t('directory.filterOptions.inactive'), value: "inactive" },
      ],
    },
  ];

  // Faceted filter options for invites
  const inviteFacetedFilters = [
    {
      columnId: "role",
      title: t('directory.filters.role'),
      options: [
        { label: t('directory.roles.admin'), value: "ADMIN" },
        { label: t('directory.roles.veterinarian'), value: "VETERINARIAN" },
        { label: t('directory.roles.worker'), value: "WORKER" },
      ],
    },
    {
      columnId: "status",
      title: t('directory.filters.status'),
      options: [
        { label: t('invites.status.pending'), value: "PENDING" },
        { label: t('invites.status.accepted'), value: "ACCEPTED" },
        { label: t('invites.status.expired'), value: "EXPIRED" },
        { label: t('invites.status.cancelled'), value: "CANCELLED" },
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
        <h2 className="text-2xl font-bold tracking-tight">{t('directory.title')}</h2>
        <p className="text-muted-foreground">
          {t('directory.manageDescription')}
        </p>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="staff">{t('directory.tabs.staffMembers')}</TabsTrigger>
          <TabsTrigger value="invites">{t('directory.tabs.invitesSent')}</TabsTrigger>
        </TabsList>

        {/* Staff Members Tab */}
        <TabsContent value="staff" className="space-y-6">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">{t('directory.loading.staffMembers')}</p>
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
                    {t('directory.errors.tryAgain')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>{t('directory.cards.staffMembers', { count: staffData.length })}</CardTitle>
              <CardDescription>
                {t('directory.cards.staffMembersDescription')}
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddStaffDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              {t('directory.buttons.addStaff')}
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
                <CardTitle className="text-sm font-medium">{t('directory.cards.total')}</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isInviteLoading ? (
                  <div className="text-2xl font-bold">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{inviteStats.total}</div>
                    <p className="text-xs text-muted-foreground">
                      {t('directory.cards.allInvitations')}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('directory.cards.pending')}</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isInviteLoading ? (
                  <div className="text-2xl font-bold text-yellow-600">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-yellow-600">{inviteStats.pending}</div>
                    <p className="text-xs text-muted-foreground">
                      {t('directory.cards.awaitingResponse')}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('directory.cards.accepted')}</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isInviteLoading ? (
                  <div className="text-2xl font-bold text-green-600">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-green-600">{inviteStats.accepted}</div>
                    <p className="text-xs text-muted-foreground">
                      {t('directory.cards.successfullyJoined')}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('directory.cards.expired')}</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isInviteLoading ? (
                  <div className="text-2xl font-bold text-red-600">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-red-600">{inviteStats.expired}</div>
                    <p className="text-xs text-muted-foreground">
                      {t('directory.cards.noLongerValid')}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {isInviteLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">{t('directory.loading.invites')}</p>
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
                    {t('directory.errors.tryAgain')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>{t('directory.cards.invitationsSent', { count: inviteData.length })}</CardTitle>
                    <CardDescription>
                      {t('directory.cards.invitationsSentDescription')}
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsInviteDialogOpen(true)}>
                    <Mail className="h-4 w-4 mr-2" />
                    {t('directory.buttons.inviteStaff')}
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
            <DialogTitle>{t('directory.viewDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('directory.viewDialog.description')}
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
                    {t(`directory.roles.${selectedStaff.role.toLowerCase()}`)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">{t('directory.viewDialog.contactInformation')}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center">
                      <MailIcon className="mr-2 h-4 w-4" />
                      {selectedStaff.email || t('directory.viewDialog.noEmail')}
                    </div>
                    <div className="flex items-center">
                      <Phone className="mr-2 h-4 w-4" />
                      {selectedStaff.phoneNumber || t('directory.viewDialog.noPhone')}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">{t('directory.viewDialog.accountInformation')}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      {t('directory.viewDialog.joined')} {new Date(selectedStaff.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Shield className="mr-2 h-4 w-4" />
                      {t('directory.viewDialog.status')} {selectedStaff.isActive ? t('directory.status.active') : t('directory.status.inactive')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              {t('directory.buttons.close')}
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              if (selectedStaff) {
                handleEditStaff(selectedStaff);
              }
            }}>
              {t('directory.buttons.editStaff')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reusable Edit Staff Dialog */}
      <EditStaffDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSubmit={handleEditSubmit}
        staff={selectedStaff}
        title="Edit Staff Member"
        description="Update staff member information and settings."
        submitButtonText="Save Changes"
        isLoading={isEditLoading}
      />

      {/* Dialog Components */}
      <StaffInviteDialog />
      <AddStaffDialog />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={
          confirmDialog.type === 'resend' 
            ? t('directory.confirmDialogs.resendTitle')
            : confirmDialog.type === 'cancel' 
            ? t('directory.confirmDialogs.cancelTitle')
            : confirmDialog.type === 'delete'
            ? t('directory.confirmDialogs.deleteTitle')
            : 'Confirm Action'
        }
        desc={
          confirmDialog.type === 'resend' 
            ? t('directory.confirmDialogs.resendDescription', { email: confirmDialog.invite?.email })
            : confirmDialog.type === 'cancel'
            ? t('directory.confirmDialogs.cancelDescription', { email: confirmDialog.invite?.email })
            : confirmDialog.type === 'delete'
            ? t('directory.confirmDialogs.deleteDescription', { name: `${confirmDialog.staff?.firstName} ${confirmDialog.staff?.lastName}` })
            : 'Are you sure you want to proceed?'
        }
        confirmText={
          confirmDialog.type === 'resend' 
            ? t('directory.confirmDialogs.resendConfirm')
            : confirmDialog.type === 'cancel' 
            ? t('directory.confirmDialogs.cancelConfirm')
            : confirmDialog.type === 'delete'
            ? t('directory.confirmDialogs.deleteConfirm')
            : 'Continue'
        }
        cancelBtnText={t('directory.confirmDialogs.cancel')}
        destructive={confirmDialog.type === 'cancel' || confirmDialog.type === 'delete'}
        handleConfirm={handleConfirmAction}
        isLoading={actionLoading === (confirmDialog.invite?.id || confirmDialog.staff?.id)}
      />
    </div>
  );
}