"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Palette,
  Globe,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { updateUserPreferences, getUserPreferences } from "@/app/(dashboard)/settings/server/settings";
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface PreferencesSettingsProps {}

export function PreferencesSettings({}: PreferencesSettingsProps) {
  const t = useTranslations('settings.preferences');
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    theme: "system",
    language: "en", // Default to English
  });

  // Load current language from cookie
  useEffect(() => {
    const getCurrentLanguage = () => {
      const cookies = document.cookie.split(';');
      const localeCookie = cookies.find(cookie => cookie.trim().startsWith('NEXT_LOCALE='));
      if (localeCookie) {
        const locale = localeCookie.split('=')[1];
        if (['en', 'am'].includes(locale)) {
          setFormData(prev => ({ ...prev, language: locale }));
        }
      }
    };
    
    getCurrentLanguage();
  }, []);

  const handleInputChange = (
    field: string,
    value: string | boolean | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleLanguageChange = (newLanguage: string) => {
    // Update the locale cookie and refresh the page
    document.cookie = `NEXT_LOCALE=${newLanguage};path=/;max-age=31536000`;
    router.refresh();
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    handleInputChange("theme", newTheme);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await updateUserPreferences(formData);

      if (result.success) {
        toast.success(t('preferencesUpdateSuccess'));
        setHasChanges(false);
      } else {
        toast.error(result.message || t('preferencesUpdateError'));
      }
    } catch (error) {
      toast.error(t('preferencesUpdateError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t('appearanceTitle')}
          </CardTitle>
          <CardDescription>
            {t('appearanceDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">{t('theme')}</Label>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => handleThemeChange("light")}
                className="flex items-center gap-2"
              >
                <Sun className="h-4 w-4" />
                {t('light')}
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => handleThemeChange("dark")}
                className="flex items-center gap-2"
              >
                <Moon className="h-4 w-4" />
                {t('dark')}
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => handleThemeChange("system")}
                className="flex items-center gap-2"
              >
                <Monitor className="h-4 w-4" />
                {t('system')}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('themeHelp')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('languageTitle')}
          </CardTitle>
          <CardDescription>
            {t('languageDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">{t('language')}</Label>
            <Select
              value={formData.language}
              onValueChange={(value) => {
                handleInputChange("language", value);
                handleLanguageChange(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectLanguage')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="am">አማርኛ</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {t('languageHelp')}
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}