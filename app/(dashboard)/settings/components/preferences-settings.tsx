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
  Palette,
  Globe,
  Save,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { updatePreferences, getUserPreferences } from "@/server/settings";

interface PreferencesSettingsProps {}

export function PreferencesSettings({}: PreferencesSettingsProps) {
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    theme: "system",
    language: "en", // Default to English
  });

  // Track changes
  useEffect(() => {
    // No longer need to track changes for parent component
  }, [hasChanges]);

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

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    handleInputChange("theme", newTheme);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await updatePreferences(formData);

      if (result.success) {
        toast.success("Preferences updated successfully");
        setHasChanges(false);
      } else {
        toast.error(result.message || "Failed to update preferences");
      }
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error("Failed to update preferences");
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
            Theme
          </CardTitle>
          <CardDescription>
            Choose your preferred theme for the interface.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Dark
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    System
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Language
          </CardTitle>
          <CardDescription>
            Select your preferred language for the interface.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Language</Label>
            <Select
              value={formData.language}
              onValueChange={(value) => handleInputChange("language", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="am">አማርኛ</SelectItem>
                <SelectItem value="om">Afaan Oromoo</SelectItem>
              </SelectContent>
            </Select>
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
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
