"use client";

import { useState } from "react";
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Syringe,
  Activity,
  Skull,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Shield,
} from "lucide-react";

// Import components (we'll create these)
import { VaccinationRecords } from "./components/vaccination/vaccination-records";
import { DiseaseTreatment } from "./components/treatment/disease-treatment";
import { MortalityManagement } from "./components/mortality/mortality-management";
import { HealthAnalytics } from "./components/analytics/health-analytics";
import { PageBanner } from "@/components/ui/page-banner";

export default function HealthManagementPage() {
  const [activeTab, setActiveTab] = useState("vaccinations");
  const t = useTranslations('health');


  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <PageBanner
        title={t('title')}
        description={t('description')}
        imageSrc="/banner-bg-image.webp"
      />

      {/* Main Content with Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="vaccinations">{t('vaccination.title')}</TabsTrigger>
          <TabsTrigger value="treatments">{t('treatment.title')}</TabsTrigger>
          <TabsTrigger value="mortality">{t('mortality.title')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('analytics.title')}</TabsTrigger>
        </TabsList>

        {/* Vaccination Records Tab */}
        <TabsContent value="vaccinations">
          <VaccinationRecords />
        </TabsContent>

        {/* Disease Treatment Tab */}
        <TabsContent value="treatments">
          <DiseaseTreatment />
        </TabsContent>

        {/* Mortality Management Tab */}
        <TabsContent value="mortality">
          <MortalityManagement />
        </TabsContent>

        {/* Health Analytics Tab */}
        <TabsContent value="analytics">
          <HealthAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
