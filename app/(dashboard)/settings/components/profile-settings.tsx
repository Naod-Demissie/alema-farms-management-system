"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Mail, 
  Phone, 
  Camera,
  Save,
  AlertCircle,
  CheckCircle,
  X
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { updateProfile, getUserProfile } from "@/app/(dashboard)/settings/server/settings";
import { authClient } from "@/lib/auth-client";
import { refreshUserSession } from "@/lib/session-refresh";
import { useTranslations } from 'next-intl';

interface ProfileSettingsProps {}

export function ProfileSettings({}: ProfileSettingsProps) {
  const t = useTranslations('settings.profile');
  const { data: session, refetch } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    isActive: true,
    profileImage: ""
  });

  // Initialize form data from session
  useEffect(() => {
    const loadProfile = async () => {
      if (session?.user) {
        const user = session.user as any;
        setFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          phoneNumber: user.phoneNumber || "",
          isActive: user.isActive ?? true,
          profileImage: user.image || ""
        });
      }
    };
    loadProfile();
  }, [session]);

  // Track changes
  useEffect(() => {
    // No longer need to track changes for parent component
  }, [hasChanges]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(t('imageTypeError'));
        return;
      }

      // Validate file size (2MB limit)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > maxSize) {
        toast.error(t('imageSizeError'));
        return;
      }

      // Convert to base64 and resize to 90x90 pixels
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
          
          setFormData(prev => ({
            ...prev,
            profileImage: compressedImage
          }));
          setHasChanges(true);
        };
        img.src = result;
      };
      reader.onerror = () => {
        toast.error(t('imageReadError'));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      profileImage: ""
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await updateProfile(formData);

      if (result.success) {
        setHasChanges(false);
        toast.success(t('updateSuccess'));
        
        // Refresh the session to get updated user data
        try {
          await refreshUserSession();
          await refetch();
        } catch (sessionError) {
          console.warn("Failed to refresh session:", sessionError);
          // Still show success since the profile was updated
        }
      } else {
        toast.error(result.message || t('updateError'));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('updateError'));
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Profile Picture Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('pictureTitle')}
          </CardTitle>
          <CardDescription>
            {t('pictureDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={formData.profileImage || undefined} alt="Profile" />
              <AvatarFallback className="text-lg">
                {getInitials(formData.firstName, formData.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-3">
              <Button variant="outline" size="sm" asChild>
                <label htmlFor="profile-image" className="cursor-pointer">
                  <Camera className="mr-2 h-4 w-4" />
                  {t('changePicture')}
                </label>
              </Button>
              {formData.profileImage && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRemoveImage}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="mr-2 h-4 w-4" />
                  {t('removePicture')}
                </Button>
              )}
              <input
                id="profile-image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <p className="text-sm text-muted-foreground">
                {t('imageHelp')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('personalInfo')}</CardTitle>
          <CardDescription>
            {t('personalInfoDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                {t('firstName')} <span className="text-red-500">{t('required')}</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder={t('firstNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">
                {t('lastName')} <span className="text-red-500">{t('required')}</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder={t('lastNamePlaceholder')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">
                {t('email')} <span className="text-red-500">{t('required')}</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">{t('phoneNumber')}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder={t('phonePlaceholder')}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || isLoading}
          className="min-w-[120px]"
        >
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {t('saving')}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t('saveChanges')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
