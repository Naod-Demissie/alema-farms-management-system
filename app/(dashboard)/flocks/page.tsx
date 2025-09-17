"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { FlockManagementMerged } from "./components/flock-management";
import { getFlocks } from "@/server/flocks";
import { Flock } from "./components/flock-types";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading flocks...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Content */}
      <FlockManagementMerged
        flocks={flocks}
        onFlockCreated={handleFlockCreated}
        onFlockUpdated={handleFlockUpdated}
        onFlockDeleted={handleFlockDeleted}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
