"use client";

import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { Loader2 } from "lucide-react";
import { FlockManagementMerged } from "./components/flock-management";
import { getFlocks } from "@/app/(dashboard)/flocks/server/flocks";
import { Flock } from "./components/flock-types";
import { PageBanner } from "@/components/ui/page-banner";

export default function FlocksPage() {
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const t = useTranslations('flocks');

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const flocksResult = await getFlocks({}, { page: 1, limit: 50 }, { field: 'createdAt', direction: 'desc' });

      if (flocksResult.success) {
        setFlocks(flocksResult.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleFlockCreated = (newFlock: Flock) => {
    setFlocks(prev => [newFlock, ...prev]);
    // No need to call loadData() as we already have the new flock
  };

  const handleFlockUpdated = (updatedFlock: Flock) => {
    setFlocks(prev => 
      prev.map(flock => 
        flock.id === updatedFlock.id ? updatedFlock : flock
      )
    );
    // No need to call loadData() as we already have the updated flock
  };

  const handleFlockDeleted = (flockId: string) => {
    setFlocks(prev => prev.filter(flock => flock.id !== flockId));
    // No need to call loadData() as we already removed the flock
  };

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <PageBanner
        title={t('title')}
        description={t('description')}
        imageSrc="/banner-bg-image.webp"
      />

      {/* Main Content */}
      <FlockManagementMerged
        flocks={flocks}
        onFlockCreated={handleFlockCreated}
        onFlockUpdated={handleFlockUpdated}
        onFlockDeleted={handleFlockDeleted}
        onRefresh={handleRefresh}
        loading={loading}
      />
    </div>
  );
}
