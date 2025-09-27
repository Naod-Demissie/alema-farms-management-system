"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Shield,
  Palette,
} from "lucide-react";

// Import settings components
import { ProfileSettings } from "./components/profile-settings";
import { AccountSettings } from "./components/account-settings";
import { PreferencesSettings } from "./components/preferences-settings";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

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
      </div>

      {/* Settings Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings Tab */}
        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>

        {/* Account Settings Tab */}
        <TabsContent value="account">
          <AccountSettings />
        </TabsContent>

        {/* Preferences Settings Tab */}
        <TabsContent value="preferences">
          <PreferencesSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
