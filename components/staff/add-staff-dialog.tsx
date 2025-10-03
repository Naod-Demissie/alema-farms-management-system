"use client";

import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createNonSystemStaff } from "@/server/staff-invites";
import { toast } from "sonner";
import { Upload, User, X } from "lucide-react";

const addStaffFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().optional(),
  image: z.string().optional(),
});

type AddStaffFormValues = z.infer<typeof addStaffFormSchema>;

interface AddStaffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: AddStaffFormValues) => Promise<void>;
  title?: string;
  description?: string;
  submitButtonText?: string;
}

export function AddStaffDialog({
  isOpen,
  onClose,
  onSubmit,
  title = "Add Staff Member",
  description = "Add a new worker to the system.",
  submitButtonText = "Add Staff Member"
}: AddStaffDialogProps) {
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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file");
        return;
      }

      // Validate file size (2MB limit)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > maxSize) {
        toast.error("Image size must be less than 2MB");
        return;
      }

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
        img.onerror = () => {
          toast.error("Failed to process image");
        };
        img.src = result;
      };
      reader.onerror = () => {
        toast.error("Failed to read image file");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview("");
    form.setValue("image", "");
  };

  const handleSubmit = async (data: AddStaffFormValues) => {
    setIsLoading(true);
    try {
      if (onSubmit) {
        // Use custom submit handler if provided
        await onSubmit(data);
      } else {
        // Default submit handler
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
        } else {
          toast.error(result.message || "Failed to add staff member");
        }
      }
      
      // Reset form and close dialog on success
      form.reset();
      setImagePreview("");
      onClose();
    } catch (error) {
      console.error("Failed to add staff member:", error);
      toast.error("Failed to add staff member");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        image: "",
      });
      setImagePreview("");
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Profile Image Upload */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={imagePreview || undefined} />
                <AvatarFallback>
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
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
                {imagePreview && (
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm" 
                    onClick={handleRemoveImage}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Remove Picture
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or GIF. Max size 2MB.
                </p>
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
                  <FormLabel>Phone Number</FormLabel>
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
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : submitButtonText}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
