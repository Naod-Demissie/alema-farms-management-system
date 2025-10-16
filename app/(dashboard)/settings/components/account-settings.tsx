"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  changePassword,
} from "@/app/(dashboard)/settings/server/settings";
import { authClient } from "@/lib/auth-client";
import { useTranslations } from 'next-intl';

interface AccountSettingsProps {}

export function AccountSettings({}: AccountSettingsProps) {
  const t = useTranslations('settings.account');
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  // Password strength validation
  const getPasswordStrength = (password: string) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    return { checks, score };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  const handlePasswordChange = async () => {
    // Validate current password
    if (!formData.currentPassword.trim()) {
      toast.error(t('currentPasswordRequired'));
      return;
    }

    // Validate new password
    if (!formData.newPassword.trim()) {
      toast.error(t('newPasswordRequired'));
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error(t('passwordMinLength'));
      return;
    }

    // Check if new password is different from current
    if (formData.currentPassword === formData.newPassword) {
      toast.error(t('passwordDifferent'));
      return;
    }

    // Validate password confirmation
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error(t('passwordsNoMatch'));
      return;
    }

    // Additional password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(formData.newPassword)) {
      toast.error(t('passwordStrength'));
      return;
    }

    setIsLoading(true);
    try {
      // Try server-side password change first
      const result = await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      if (result.success) {
        toast.success(t('passwordUpdateSuccess'));
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setHasChanges(false);
      } else {
        // Check if it's a 400 error and show specific message
        if (result.message && result.message.includes('400') || result.message?.includes('Bad Request')) {
          toast.error(t('passwordChangeFailed'));
        } else {
          toast.error(result.message || t('passwordUpdateError'));
        }
        
        // Fallback to client-side password change
        try {
          const clientResult = await authClient.changePassword({
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
            revokeOtherSessions: false,
          });

          if (clientResult.error) {
            // Check if it's a 400 error from client-side
            if (clientResult.error.message && (clientResult.error.message.includes('400') || clientResult.error.message.includes('Bad Request'))) {
              toast.error(t('passwordChangeFailed'));
            } else {
              toast.error(clientResult.error.message || t('passwordUpdateError'));
            }
          } else {
            toast.success(t('passwordUpdateSuccess'));
            setFormData({
              currentPassword: "",
              newPassword: "",
              confirmPassword: "",
            });
            setHasChanges(false);
          }
        } catch (clientError) {
          // Check if it's a 400 error from client-side catch
          if (result.message && (result.message.includes('400') || result.message.includes('Bad Request'))) {
            toast.error(t('passwordChangeFailed'));
          } else {
            toast.error(result.message || t('passwordUpdateError'));
          }
        }
      }
    } catch (error) {
      toast.error(t('unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('passwordTitle')}
          </CardTitle>
          <CardDescription>
            {t('passwordDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                placeholder={t('currentPasswordPlaceholder')}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('newPassword')}</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => handleInputChange("newPassword", e.target.value)}
                placeholder={t('newPasswordPlaceholder')}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Password Requirements */}
            {formData.newPassword && (
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">{t('passwordRequirements')}</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {passwordStrength.checks.length ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={passwordStrength.checks.length ? "text-green-600" : "text-red-600"}>
                      {t('minLength')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordStrength.checks.uppercase ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={passwordStrength.checks.uppercase ? "text-green-600" : "text-red-600"}>
                      {t('uppercase')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordStrength.checks.lowercase ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={passwordStrength.checks.lowercase ? "text-green-600" : "text-red-600"}>
                      {t('lowercase')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordStrength.checks.number ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={passwordStrength.checks.number ? "text-green-600" : "text-red-600"}>
                      {t('number')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordStrength.checks.special ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={passwordStrength.checks.special ? "text-green-600" : "text-red-600"}>
                      {t('specialChar')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                placeholder={t('confirmPasswordPlaceholder')}
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
          </div>

          <Button 
            onClick={handlePasswordChange} 
            disabled={isLoading || !hasChanges || passwordStrength.score < 5 || !formData.currentPassword || !formData.confirmPassword}
          >
            {isLoading ? t('updating') : t('updatePassword')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}