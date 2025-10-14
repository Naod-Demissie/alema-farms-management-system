"use client";

import { useState } from "react";
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedInventory } from "./feed-inventory";
import { FeedSuppliers } from "../suppliers/feed-suppliers";

export function FeedInventoryManagement() {
  const [activeTab, setActiveTab] = useState("inventory");
  const t = useTranslations('feed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('inventory.title')}</h2>
          <p className="text-muted-foreground">
            {t('inventory.description')}
          </p>
        </div>
      </div>

      {/* Nested Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="inventory">{t('inventory.tabs.inventory')}</TabsTrigger>
          <TabsTrigger value="suppliers">{t('inventory.tabs.suppliers')}</TabsTrigger>
        </TabsList>

        {/* Feed Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4 mt-4 sm:mt-0">
          <FeedInventory />
        </TabsContent>

        {/* Feed Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-4 mt-4 sm:mt-0">
          <FeedSuppliers />
        </TabsContent>
      </Tabs>
    </div>
  );
}

