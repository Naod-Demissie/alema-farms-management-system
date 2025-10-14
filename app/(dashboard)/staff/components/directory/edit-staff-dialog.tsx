"use client";

import React, { useEffect, useState } from "react";
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
import { toast } from "sonner";
import { Upload, User, X, Loader2 } from "lucide-react";
import { useTranslations } from 'next-intl';

const getEditStaffFormSchema = (t: any) => z.object({
  firstName: z.string().min(1, t('directory.dialogs.edit.validation.firstNameRequired')),
  lastName: z.string().min(1, t('directory.dialogs.edit.validation.lastNameRequired')),
  email: z.string().email(t('directory.dialogs.edit.validation.invalidEmail')).optional().or(z.literal("")),
  phoneNumber: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean(),
});

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  role: string;
  image?: string;
  isActive: boolean;
}

interface EditStaffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => Promise<void>;
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
  title,
  description,
  submitButtonText,
  isLoading = false
}: EditStaffDialogProps) {
  const t = useTranslations('staff');
  const [imagePreview, setImagePreview] = useState<string>("");

  const editStaffFormSchema = getEditStaffFormSchema(t);
  type EditStaffFormValues = z.infer<typeof editStaffFormSchema>;

  const form = useForm<EditStaffFormValues>({
    resolver: zodResolver(editStaffFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      image: "",
      isActive: true,
    },
  });

  // Update form values when staff data changes
  useEffect(() => {
    if (staff && isOpen) {
      form.reset({
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email || "",
        phoneNumber: staff.phoneNumber || "",
        image: staff.image || "",
        isActive: staff.isActive,
      });
      setImagePreview(staff.image || "");
    }
  }, [staff, isOpen, form]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(t('directory.dialogs.edit.imageTypeError'));
        return;
      }

      // Validate file size (2MB limit)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > maxSize) {
        toast.error(t('directory.dialogs.edit.imageSizeError'));
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
          toast.error(t('directory.dialogs.edit.imageProcessError'));
        };
        img.src = result;
      };
      reader.onerror = () => {
        toast.error(t('directory.dialogs.edit.imageReadError'));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview("");
    form.setValue("image", "");
  };

  const handleSubmit = async (data: EditStaffFormValues) => {
    if (!staff) return;
    
    try {
      if (onSubmit) {
        await onSubmit(data);
      }
      onClose();
    } catch (error) {
      console.error("Failed to update staff member:", error);
      toast.error(t('directory.dialogs.edit.errorMessage'));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title || t('directory.dialogs.edit.title')}</DialogTitle>
          <DialogDescription>
            {description || t('directory.dialogs.edit.description')}
          </DialogDescription>
        </DialogHeader>
        {staff && (
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
                    <span>{t('directory.dialogs.edit.uploadPicture')}</span>
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
                    {t('directory.dialogs.edit.removePicture')}
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  {t('directory.dialogs.edit.imageHelp')}
                </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('directory.dialogs.edit.firstName')} <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input className="w-full" placeholder={t('directory.dialogs.edit.firstNamePlaceholder')} {...field} />
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
                    <FormLabel>{t('directory.dialogs.edit.lastName')} <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input className="w-full" placeholder={t('directory.dialogs.edit.lastNamePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('directory.dialogs.edit.email')}</FormLabel>
                  <FormControl>
                    <Input className="w-full" placeholder={t('directory.dialogs.edit.emailPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('directory.dialogs.edit.phoneNumber')}</FormLabel>
                    <FormControl>
                      <Input className="w-full" placeholder={t('directory.dialogs.edit.phonePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('directory.dialogs.edit.status')}</FormLabel>
                    <FormControl>
                      <Select 
                        value={field.value ? "active" : "inactive"}
                        onValueChange={(value) => field.onChange(value === "active")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">{t('directory.status.active')}</SelectItem>
                          <SelectItem value="inactive">{t('directory.status.inactive')}</SelectItem>
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
                {t('directory.dialogs.edit.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? t('directory.dialogs.edit.saving') : (submitButtonText || t('directory.dialogs.edit.submit'))}
              </Button>
            </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
