"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Key, 
  Smartphone, 
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Download,
  Trash2,
  Save,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { updatePassword, updateSecuritySettings, revokeSession, getActiveSessions } from "@/server/settings";

interface SecuritySettingsProps {
  onChanges: (hasChanges: boolean) => void;
}

export function SecuritySettings({ onChanges }: SecuritySettingsProps) {
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
    twoFactorEnabled: false,
    backupCodes: [],
    sessionTimeout: 30,
    loginAlerts: true,
    suspiciousActivityAlerts: true,
    passwordExpiry: 90
  });

  // Mock data for demonstration
  const [activeSessions] = useState([
    {
      id: "1",
      device: "Chrome on Windows",
      location: "New York, NY",
      lastActive: "2 hours ago",
      current: true
    },
    {
      id: "2", 
      device: "Safari on iPhone",
      location: "San Francisco, CA",
      lastActive: "1 day ago",
      current: false
    }
  ]);

  const [recentLogins] = useState([
    {
      id: "1",
      device: "Chrome on Windows",
      location: "New York, NY",
      time: "2 hours ago",
      status: "success"
    },
    {
      id: "2",
      device: "Safari on iPhone", 
      location: "San Francisco, CA",
      time: "1 day ago",
      status: "success"
    },
    {
      id: "3",
      device: "Firefox on Linux",
      location: "Unknown",
      time: "3 days ago",
      status: "failed"
    }
  ]);

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handlePasswordChange = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    try {
      const result = await updatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (result.success) {
        toast.success("Password updated successfully");
        setFormData(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        }));
        setHasChanges(false);
      } else {
        toast.error(result.message || "Failed to update password");
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error("Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorToggle = async () => {
    setIsLoading(true);
    try {
      const result = await updateSecuritySettings({
        twoFactorEnabled: !formData.twoFactorEnabled,
        loginAlerts: formData.loginAlerts,
        suspiciousActivityAlerts: formData.suspiciousActivityAlerts,
        passwordExpiry: formData.passwordExpiry
      });

      if (result.success) {
        setFormData(prev => ({
          ...prev,
          twoFactorEnabled: !prev.twoFactorEnabled
        }));
        toast.success(formData.twoFactorEnabled ? "2FA disabled" : "2FA enabled");
        setHasChanges(false);
      } else {
        toast.error(result.message || "Failed to update 2FA settings");
      }
    } catch (error) {
      console.error('Error updating 2FA:', error);
      toast.error("Failed to update 2FA settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setIsLoading(true);
    try {
      const result = await revokeSession(sessionId);

      if (result.success) {
        toast.success("Session revoked successfully");
        // Refresh sessions list
      } else {
        toast.error(result.message || "Failed to revoke session");
      }
    } catch (error) {
      console.error('Error revoking session:', error);
      toast.error("Failed to revoke session");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadBackupCodes = () => {
    // Generate and download backup codes
    const codes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );
    
    const content = codes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Backup codes downloaded");
  };

  return (
    <div className="space-y-6">
      {/* Password Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Password Security
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
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
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
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
              disabled={!formData.currentPassword || !formData.newPassword || !formData.confirmPassword || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Password
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                {formData.twoFactorEnabled 
                  ? "Your account is protected with 2FA" 
                  : "Add an extra layer of security to your account"
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.twoFactorEnabled}
                onCheckedChange={handleTwoFactorToggle}
                disabled={isLoading}
              />
              <Badge variant={formData.twoFactorEnabled ? "default" : "secondary"}>
                {formData.twoFactorEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>

          {formData.twoFactorEnabled && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">Backup Codes</p>
                  <p className="text-sm text-muted-foreground">
                    Download backup codes in case you lose access to your device
                  </p>
                </div>
                <Button variant="outline" onClick={handleDownloadBackupCodes}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Manage your active sessions and devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeSessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{session.device}</p>
                  {session.current && (
                    <Badge variant="default" className="text-xs">Current</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {session.location} • {session.lastActive}
                </p>
              </div>
              {!session.current && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRevokeSession(session.id)}
                  disabled={isLoading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Login Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Recent Login Activity
          </CardTitle>
          <CardDescription>
            Review your recent login attempts and activity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentLogins.map((login) => (
            <div key={login.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{login.device}</p>
                  <Badge 
                    variant={login.status === "success" ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {login.status === "success" ? (
                      <CheckCircle className="mr-1 h-3 w-3" />
                    ) : (
                      <AlertTriangle className="mr-1 h-3 w-3" />
                    )}
                    {login.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {login.location} • {login.time}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Security Preferences</CardTitle>
          <CardDescription>
            Configure your security preferences and alerts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="loginAlerts">Login Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when someone logs into your account
                </p>
              </div>
              <Switch
                id="loginAlerts"
                checked={formData.loginAlerts}
                onCheckedChange={(checked) => handleInputChange('loginAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="suspiciousActivityAlerts">Suspicious Activity Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about unusual account activity
                </p>
              </div>
              <Switch
                id="suspiciousActivityAlerts"
                checked={formData.suspiciousActivityAlerts}
                onCheckedChange={(checked) => handleInputChange('suspiciousActivityAlerts', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
