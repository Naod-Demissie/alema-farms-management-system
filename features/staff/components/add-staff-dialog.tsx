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
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useStaff } from "../context/staff-context";
import { createNonSystemStaff } from "@/server/staff-invites";
import { toast } from "sonner";
import { Upload, User } from "lucide-react";

const addStaffFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().optional(),
  image: z.string().optional(),
});

type AddStaffFormValues = z.infer<typeof addStaffFormSchema>;

export function AddStaffDialog() {
  const { isAddStaffDialogOpen, setIsAddStaffDialogOpen, refreshStaff } = useStaff();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");

  const form = useForm<AddStaffFormValues>({
    resolver: zodResolver(addStaffFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      image: "",
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        
        // Create a new image to resize and compress
        const img = new Image();
        img.onload = () => {
          // Create canvas for resizing
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) return;
          
          // Set canvas size to 90x90
          canvas.width = 90;
          canvas.height = 90;
          
          // Draw and resize the image
          ctx.drawImage(img, 0, 0, 90, 90);
          
          // Convert to base64 with compression
          const compressedImage = canvas.toDataURL('image/jpeg', 0.8);
          
          setImagePreview(compressedImage);
          form.setValue("image", compressedImage);
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: AddStaffFormValues) => {
    setIsLoading(true);
    try {
      const result = await createNonSystemStaff({
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber || "",
        image: data.image || "",
        role: "WORKER",
        isSystemUser: false,
      });
      
      if (result.success) {
        toast.success("Staff member added successfully!");
        form.reset();
        setImagePreview("");
        setIsAddStaffDialogOpen(false);
        // Refresh staff list to show the new member
        refreshStaff();
      } else {
        toast.error(result.message || "Failed to add staff member");
      }
    } catch (error) {
      console.error("Failed to add staff member:", error);
      toast.error("Failed to add staff member");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Dialog open={isAddStaffDialogOpen} onOpenChange={setIsAddStaffDialogOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
          <DialogDescription>
            Add a new worker to the system.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Profile Image Upload */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={imagePreview} />
                <AvatarFallback>
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-500">
                    <Upload className="h-4 w-4" />
                    <span>Upload Profile Picture</span>
                  </div>
                </Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name <span className="text-red-500">*</span></FormLabel>
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
                    <FormLabel>Last Name <span className="text-red-500">*</span></FormLabel>
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