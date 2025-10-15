"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageBanner } from "@/components/ui/page-banner";
import { TemperatureManagement } from "./components/temperature/temperature-management";
import { LightingManagement } from "./components/lighting/lighting-management";

export default function EnvironmentPage() {
  const [activeTab, setActiveTab] = useState("temperature");
  const t = useTranslations("environment");

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <PageBanner
        title={t("title")}
        description={t("description")}
        imageSrc="/banner-bg-image.webp"
      />

      {/* Main Content with Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="temperature">{t("temperature.title")}</TabsTrigger>
          <TabsTrigger value="lighting">{t("lighting.title")}</TabsTrigger>
        </TabsList>

        {/* Temperature Tab */}
        <TabsContent value="temperature">
          <TemperatureManagement />
        </TabsContent>

        {/* Lighting Tab */}
        <TabsContent value="lighting">
          <LightingManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}

