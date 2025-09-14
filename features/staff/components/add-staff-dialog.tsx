"use client";

import { useState } from "react";
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
import { useStaff } from "../context/staff-context";
import { toast } from "sonner";

const addStaffFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  phoneNumber: z.string().optional(),
  role: z.enum(["WORKER", "VETERINARIAN"], {
    required_error: "Please select a role",
  }),
  isSystemUser: z.boolean(),
});

type AddStaffFormValues = z.infer<typeof addStaffFormSchema>;

export function AddStaffDialog() {
  const { isAddStaffDialogOpen, setIsAddStaffDialogOpen, refreshStaff } = useStaff();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AddStaffFormValues>({
    resolver: zodResolver(addStaffFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      role: "WORKER",
      isSystemUser: false,
    },
  });

  const onSubmit = async (data: AddStaffFormValues) => {
    setIsLoading(true);
    try {
      // Here you would call your API to add the staff member
      // For now, we'll just simulate success
      console.log("Adding staff member:", data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Staff member added successfully!");
      form.reset();
      setIsAddStaffDialogOpen(false);
      refreshStaff();
    } catch (error) {
      toast.error("Failed to add staff member");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffTypeChange = (isSystemUser: boolean) => {
    form.setValue("isSystemUser", isSystemUser);
    form.setValue("role", isSystemUser ? "VETERINARIAN" : "WORKER");
    if (!isSystemUser) {
      form.setValue("email", "");
    }
  };

  return (
    <Dialog open={isAddStaffDialogOpen} onOpenChange={setIsAddStaffDialogOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
          <DialogDescription>
            Add a new staff member to the system. Choose between system user (requires email) or non-system user (worker).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
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
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isSystemUser"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Staff Type *</FormLabel>
                  <Select 
                    value={field.value ? "SYSTEM_USER" : "NON_SYSTEM_USER"} 
                    onValueChange={(value) => handleStaffTypeChange(value === "SYSTEM_USER")}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SYSTEM_USER">System User (Admin/Vet) - Requires Email</SelectItem>
                      <SelectItem value="NON_SYSTEM_USER">Non-System User (Worker) - No Email Required</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {form.watch("isSystemUser") ? (
                        <>
                          <SelectItem value="VETERINARIAN">Veterinarian</SelectItem>
                        </>
                      ) : (
                        <SelectItem value="WORKER">Worker</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email {form.watch("isSystemUser") ? "*" : "(Optional)"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="staff@company.com"
                      type="email"
                      disabled={!form.watch("isSystemUser")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddStaffDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Staff Member"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}