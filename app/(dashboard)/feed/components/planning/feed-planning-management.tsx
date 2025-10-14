"use client";

import { useState } from "react";
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedPlanning } from "./feed-planning";
import { FeedProgram } from "../program/feed-program";

export function FeedPlanningManagement() {
  const [activeTab, setActiveTab] = useState("planning");
  const t = useTranslations('feed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('planning.title')}</h2>
          <p className="text-muted-foreground">
            {t('planning.description')}
          </p>
        </div>
      </div>

      {/* Nested Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="planning">{t('planning.tabs.planning')}</TabsTrigger>
          <TabsTrigger value="program">{t('planning.tabs.program')}</TabsTrigger>
        </TabsList>

        {/* Feed Planning Tab */}
        <TabsContent value="planning" className="space-y-4 mt-4 sm:mt-0">
          <FeedPlanning />
        </TabsContent>

        {/* Feed Program Tab */}
        <TabsContent value="program" className="space-y-4 mt-4 sm:mt-0">
          <FeedProgram />
        </TabsContent>
      </Tabs>
    </div>
  );
}

