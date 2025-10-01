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
} from "@/server/settings";
import { authClient } from "@/lib/auth-client";

interface AccountSettingsProps {}

export function AccountSettings({}: AccountSettingsProps) {
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
      toast.error("Current password is required");
      return;
    }

    // Validate new password
    if (!formData.newPassword.trim()) {
      toast.error("New password is required");
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    // Check if new password is different from current
    if (formData.currentPassword === formData.newPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    // Validate password confirmation
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    // Additional password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(formData.newPassword)) {
      toast.error("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character");
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
        toast.success("Password updated successfully!");
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setHasChanges(false);
      } else {
        // Fallback to client-side password change
        try {
          const clientResult = await authClient.changePassword({
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
            revokeOtherSessions: false,
          });

          if (clientResult.error) {
            toast.error(clientResult.error.message || "Failed to update password");
          } else {
            toast.success("Password updated successfully!");
            setFormData({
              currentPassword: "",
              newPassword: "",
              confirmPassword: "",
            });
            setHasChanges(false);
          }
        } catch (clientError) {
          toast.error(result.message || "Failed to update password");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
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
            Password & Security
          </CardTitle>
          <CardDescription>
            Update your password and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                placeholder="Enter current password"
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
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => handleInputChange("newPassword", e.target.value)}
                placeholder="Enter new password"
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
                <p className="text-muted-foreground">Password requirements:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {passwordStrength.checks.length ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={passwordStrength.checks.length ? "text-green-600" : "text-red-600"}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordStrength.checks.uppercase ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={passwordStrength.checks.uppercase ? "text-green-600" : "text-red-600"}>
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordStrength.checks.lowercase ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={passwordStrength.checks.lowercase ? "text-green-600" : "text-red-600"}>
                      One lowercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordStrength.checks.number ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={passwordStrength.checks.number ? "text-green-600" : "text-red-600"}>
                      One number
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordStrength.checks.special ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={passwordStrength.checks.special ? "text-green-600" : "text-red-600"}>
                      One special character (@$!%*?&)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                placeholder="Confirm new password"
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
            {isLoading ? "Updating..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}