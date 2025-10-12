"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedInventory } from "./components/inventory/feed-inventory";
import { FeedUsage } from "./components/usage/feed-usage";
import { FeedSuppliers } from "./components/suppliers/feed-suppliers";
import { FeedProgram } from "./components/program/feed-program";
import { FeedPlanning } from "./components/planning/feed-planning";
import { PageBanner } from "@/components/ui/page-banner";

export default function FeedManagementPage() {
  const [activeTab, setActiveTab] = useState("usage");

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <PageBanner
        title="Feed Management"
        description="Manage feed inventory, track usage, suppliers, and costs for your poultry operation"
        imageSrc="/banner-bg-image.webp"
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4 sm:space-y-0"
      >
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1 h-auto">
          <TabsTrigger value="usage">Feed Usage</TabsTrigger>
          <TabsTrigger value="planning">Feed Planning</TabsTrigger>
          <TabsTrigger value="inventory">Feed Inventory</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="program">Feed Program</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4 mt-4 sm:mt-0">
          <FeedUsage />
        </TabsContent>

        <TabsContent value="planning" className="space-y-4 mt-4 sm:mt-0">
          <FeedPlanning />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4 mt-4 sm:mt-0">
          <FeedInventory />
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4 mt-4 sm:mt-0">
          <FeedSuppliers />
        </TabsContent>

        <TabsContent value="program" className="space-y-4 mt-4 sm:mt-0">
          <FeedProgram />
        </TabsContent>
      </Tabs>
    </div>
  );
}
