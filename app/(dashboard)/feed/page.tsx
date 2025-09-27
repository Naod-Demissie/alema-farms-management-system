"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedInventory } from "./components/feed-inventory";
import { FeedUsage } from "./components/feed-usage";
import { FeedSuppliers } from "./components/feed-suppliers";
import { FeedProgram } from "./components/feed-program";
import { FeedPlanning } from "./components/feed-planning";

export default function FeedManagementPage() {
  const [activeTab, setActiveTab] = useState("usage");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Feed Management</h1>
        <p className="text-muted-foreground">
          Manage feed inventory, track usage, suppliers, and costs for your
          poultry operation.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="usage">Feed Usage</TabsTrigger>
          <TabsTrigger value="planning">Feed Planning</TabsTrigger>
          <TabsTrigger value="inventory">Feed Inventory</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="program">Feed Program</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <FeedUsage />
        </TabsContent>

        <TabsContent value="planning" className="space-y-4">
          <FeedPlanning />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <FeedInventory />
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <FeedSuppliers />
        </TabsContent>

        <TabsContent value="program" className="space-y-4">
          <FeedProgram />
        </TabsContent>
      </Tabs>
    </div>
  );
}
