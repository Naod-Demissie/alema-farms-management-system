"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { validateInvite, completeStaffRegistration } from "@/app/(dashboard)/staff/server/staff";
import { toast } from "sonner";
import { Upload, User, Mail, Phone, Lock, Eye, EyeOff, X } from "lucide-react";
import { useTranslations } from 'next-intl';

const getRegistrationSchema = (t: any) => z
  .object({
    firstName: z.string().min(1, t('validation.firstNameRequired')),
    lastName: z.string().min(1, t('validation.lastNameRequired')),
    password: z.string().min(8, t('validation.passwordMinLength')),
    confirmPassword: z.string(),
    phoneNumber: z.string().optional(),
    image: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t('validation.passwordsDontMatch'),
    path: ["confirmPassword"],
  });

function CompleteRegistrationContent() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const registrationSchema = getRegistrationSchema(t);
  type RegistrationFormValues = z.infer<typeof registrationSchema>;

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      image: "",
    },
  });

  useEffect(() => {
    const validateInvitation = async () => {
      if (!token || !email) {
        toast.error(t('invalidInvitationLink'));
        router.push("/");
        return;
      }

      try {
        const result = await validateInvite(token, email);

        if (result.success) {
          setInviteData(result.data);
        } else {
          toast.error(result.message || t('invalidInvitation'));
          router.push("/");
        }
      } catch {
        toast.error(t('failedToValidate'));
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    validateInvitation();
  }, [token, email, router, t]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(t('pleaseSelectValidImage'));
        return;
      }

      // Validate file size (2MB limit)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > maxSize) {
        toast.error(t('imageSizeTooLarge'));
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
          toast.error(t('failedToProcessImage'));
        };
        img.src = result;
      };
      reader.onerror = () => {
        toast.error(t('failedToReadImage'));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview("");
    form.setValue("image", "");
  };

  const onSubmit = async (data: RegistrationFormValues) => {
    if (!token || !email) {
      toast.error(t('invalidInvitationData'));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await completeStaffRegistration(token, email, {
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
        phoneNumber: data.phoneNumber,
        image: data.image,
      });

      if (result.success) {
        toast.success(t('registrationSuccess'));
        setTimeout(() => {
          router.push("/home");
        }, 2000);
      } else {
        toast.error(result.message || t('registrationFailed'));
      }
    } catch {
      toast.error(t('unexpectedError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      DENTIST: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      RECEPTIONIST:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    };
    return colors[role as keyof typeof colors] || "";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('validatingInvitation')}
          </p>
        </div>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">{t('invalidInvitationTitle')}</CardTitle>
            <CardDescription>
              {t('invalidInvitationDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              {t('goToHome')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {t('completeRegistration')}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t('completeRegistrationSubtitle', { 
              farmName: process.env.NEXT_PUBLIC_FARM_NAME || t('ourClinic')
            })}
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>{t('invitationDetails')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('email')}: {email}</p>
                <p className="text-sm text-muted-foreground">
                  {t('role')}:{" "}
                  <Badge className={getRoleColor(inviteData.role)}>
                    {inviteData.role}
                  </Badge>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {t('expires')}: {new Date(inviteData.expiresAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('personalInformation')}</CardTitle>
            <CardDescription>
              {t('personalInformationDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
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
                        <span>{t('uploadProfilePicture')}</span>
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
                        {t('removePicture')}
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t('imageFormatHelp')}
                    </p>
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>{t('firstName')} <span className="text-red-500">{t('required')}</span></span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('firstNamePlaceholder')}
                            {...field}
                          />
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
                        <FormLabel>{t('lastName')} <span className="text-red-500">{t('required')}</span></FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('lastNamePlaceholder')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contact Information */}
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>{t('phoneNumber')}</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('phoneNumberPlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Fields */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Lock className="h-4 w-4" />
                          <span>{t('password')} <span className="text-red-500">{t('required')}</span></span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder={t('createPasswordPlaceholder')}
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('confirmPassword')} <span className="text-red-500">{t('required')}</span></FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder={t('confirmPasswordPlaceholder')}
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? t('completingRegistration')
                    : t('completeRegistrationButton')}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LoadingFallback() {
  const t = useTranslations('auth');
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('loadingRegistration')}
        </p>
      </div>
    </div>
  );
}

export default function CompleteRegistrationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CompleteRegistrationContent />
    </Suspense>
  );
}
