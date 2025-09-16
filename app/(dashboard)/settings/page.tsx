"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  User, 
  Shield, 
  Bell, 
  Palette,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

// Import settings components
import { ProfileSettings } from "./components/profile-settings";
import { AccountSettings } from "./components/account-settings";
import { PreferencesSettings } from "./components/preferences-settings";
import { SecuritySettings } from "./components/security-settings";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {
    // Handle save logic
    setHasChanges(false);
    // Show success message
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" disabled={!hasChanges}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings Tab */}
        <TabsContent value="profile">
          <ProfileSettings onChanges={setHasChanges} />
        </TabsContent>

        {/* Account Settings Tab */}
        <TabsContent value="account">
          <AccountSettings onChanges={setHasChanges} />
        </TabsContent>

        {/* Preferences Settings Tab */}
        <TabsContent value="preferences">
          <PreferencesSettings onChanges={setHasChanges} />
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security">
          <SecuritySettings onChanges={setHasChanges} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
