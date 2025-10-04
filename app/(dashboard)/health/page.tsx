"use client";

import { useState } from "react";
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
import { VaccinationRecords } from "./components/vaccination-records";
import { DiseaseTreatment } from "./components/disease-treatment";
import { MortalityManagement } from "./components/mortality-management";
import { PageBanner } from "@/components/ui/page-banner";

export default function HealthManagementPage() {
  const [activeTab, setActiveTab] = useState("vaccinations");

  // Mock data for overview stats
  const healthStats = {
    totalVaccinations: 1247,
    activeTreatments: 23,
    healthAlerts: 5,
    mortalityRate: 2.3,
    avgWeight: 2.1,
    healthyFlock: 89.2,
  };

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <PageBanner
        title="Health & Veterinary Management"
        description="Comprehensive vaccination tracking and veterinary care management"
        imageSrc="/banner-bg-image.webp"
      />

      {/* Main Content with Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vaccinations">Vaccinations</TabsTrigger>
          <TabsTrigger value="treatments">Treatments</TabsTrigger>
          <TabsTrigger value="mortality">Mortality</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
