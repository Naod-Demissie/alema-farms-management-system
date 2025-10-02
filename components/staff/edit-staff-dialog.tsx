"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const editStaffFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().optional(),
  isActive: z.boolean(),
});

type EditStaffFormValues = z.infer<typeof editStaffFormSchema>;

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
}

interface EditStaffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: EditStaffFormValues) => Promise<void>;
  staff?: Staff | null;
  title?: string;
  description?: string;
  submitButtonText?: string;
  isLoading?: boolean;
}

export function EditStaffDialog({
  isOpen,
  onClose,
  onSubmit,
  staff,
  title = "Edit Staff Member",
  description = "Update staff member information and settings.",
  submitButtonText = "Save Changes",
  isLoading = false
}: EditStaffDialogProps) {
  const form = useForm<EditStaffFormValues>({
    resolver: zodResolver(editStaffFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      isActive: true,
    },
  });

  // Update form values when staff data changes
  useEffect(() => {
    if (staff && isOpen) {
      form.reset({
        firstName: staff.firstName,
        lastName: staff.lastName,
        phoneNumber: staff.phoneNumber || "",
        isActive: staff.isActive,
      });
    }
  }, [staff, isOpen, form]);

  const handleSubmit = async (data: EditStaffFormValues) => {
    if (!staff) return;
    
    try {
      if (onSubmit) {
        await onSubmit(data);
      }
      onClose();
    } catch (error) {
      console.error("Failed to update staff member:", error);
      toast.error("Failed to update staff member");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        {staff && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
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
                  control={form.control}
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
                <Input value={staff.email || ""} disabled />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
              </div>
              
              <FormField
                control={form.control}
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
                  <Input value={staff.role} disabled />
                  <p className="text-xs text-muted-foreground mt-1">Role cannot be changed</p>
                </div>
                <FormField
                  control={form.control}
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
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : submitButtonText}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
