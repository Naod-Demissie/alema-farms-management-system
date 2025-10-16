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
import { createNonSystemStaff } from "@/app/(dashboard)/staff/server/staff-invites";
import { toast } from "sonner";
import { Upload, User, X, Loader2 } from "lucide-react";
import { useTranslations } from 'next-intl';

const getAddStaffFormSchema = (t: any) => z.object({
  firstName: z.string().min(1, t('directory.dialogs.add.validation.firstNameRequired')),
  lastName: z.string().min(1, t('directory.dialogs.add.validation.lastNameRequired')),
  phoneNumber: z.string().optional(),
  image: z.string().optional(),
});

type AddStaffFormValues = {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  image?: string;
};

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
  title,
  description,
  submitButtonText
}: AddStaffDialogProps) {
  const t = useTranslations('staff');
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");

  const addStaffFormSchema = getAddStaffFormSchema(t);

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
        toast.error(t('directory.dialogs.add.imageTypeError'));
        return;
      }

      // Validate file size (2MB limit)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > maxSize) {
        toast.error(t('directory.dialogs.add.imageSizeError'));
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
          toast.error(t('directory.dialogs.add.imageProcessError'));
        };
        img.src = result;
      };
      reader.onerror = () => {
        toast.error(t('directory.dialogs.add.imageReadError'));
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
          toast.success(t('directory.dialogs.add.successMessage'));
        } else {
          toast.error(result.message || t('directory.dialogs.add.errorMessage'));
        }
      }
      
      // Reset form and close dialog on success
      form.reset();
      setImagePreview("");
      onClose();
    } catch (error) {
      console.error("Failed to add staff member:", error);
      toast.error(t('directory.dialogs.add.errorMessage'));
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
        <DialogHeader className="text-center">
          <DialogTitle>{title || t('directory.dialogs.add.title')}</DialogTitle>
          <DialogDescription>
            {description || t('directory.dialogs.add.description')}
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
              <div className="space-y-2 text-center">
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center space-x-2 text-sm text-blue-600 hover:text-blue-500">
                    <Upload className="h-4 w-4" />
                    <span>{t('directory.dialogs.add.uploadPicture')}</span>
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
                  <div className="flex justify-center">
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm" 
                      onClick={handleRemoveImage}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="mr-2 h-4 w-4" />
                      {t('directory.dialogs.add.removePicture')}
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  {t('directory.dialogs.add.imageHelp')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('directory.dialogs.add.firstName')} <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder={t('directory.dialogs.add.firstNamePlaceholder')} {...field} />
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
                    <FormLabel>{t('directory.dialogs.add.lastName')} <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder={t('directory.dialogs.add.lastNamePlaceholder')} {...field} />
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
                  <FormLabel>{t('directory.dialogs.add.phoneNumber')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('directory.dialogs.add.phonePlaceholder')} {...field} />
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
                {t('directory.dialogs.add.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? t('directory.dialogs.add.adding') : (submitButtonText || t('directory.dialogs.add.submit'))}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
