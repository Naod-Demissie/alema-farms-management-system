"use client";

import { useState } from "react";
import { useTranslations } from 'next-intl';
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
import { PageBanner } from "@/components/ui/page-banner";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const t = useTranslations('settings');

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <PageBanner
        title={t('title')}
        description={t('description')}
        imageSrc="/banner-bg-image.webp"
      />

      {/* Settings Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {t('profile.title')}
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('account.title')}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            {t('preferences.title')}
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
