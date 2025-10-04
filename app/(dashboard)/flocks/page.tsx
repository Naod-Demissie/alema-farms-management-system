"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { FlockManagementMerged } from "./components/flock-management";
import { getFlocks } from "@/server/flocks";
import { Flock } from "./components/flock-types";
import { PageBanner } from "@/components/ui/page-banner";

export default function FlocksPage() {
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    loadData(); // Refresh data
  };

  const handleFlockUpdated = (updatedFlock: Flock) => {
    setFlocks(prev => 
      prev.map(flock => 
        flock.id === updatedFlock.id ? updatedFlock : flock
      )
    );
    loadData(); // Refresh data
  };

  const handleFlockDeleted = (flockId: string) => {
    setFlocks(prev => prev.filter(flock => flock.id !== flockId));
    loadData(); // Refresh data
  };

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <PageBanner
        title="Flock Management"
        description="Manage your poultry flocks, track growth, and monitor health"
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
