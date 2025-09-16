"use client";

import { useState, useEffect } from "react";
import { ProductionManagement } from "./components/production-management";
import { getFlocks } from "@/server/flocks";
import { toast } from "sonner";

interface Flock {
  id: string;
  batchCode: string;
  breed: string;
  currentCount: number;
}

export default function ProductionPage() {
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlocks = async () => {
    try {
      const result = await getFlocks({}, { page: 1, limit: 100 });
      if (result.success && result.data) {
        setFlocks(result.data);
      } else {
        toast.error("Failed to load flocks");
      }
    } catch (error) {
      console.error("Error fetching flocks:", error);
      toast.error("An error occurred while loading flocks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlocks();
  }, []);

  const handleProductionCreated = () => {
    // Refresh flocks data if needed
    fetchFlocks();
  };

  const handleProductionUpdated = () => {
    // Refresh data if needed
  };

  const handleProductionDeleted = () => {
    // Refresh data if needed
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <ProductionManagement
        flocks={flocks}
        onProductionCreated={handleProductionCreated}
        onProductionUpdated={handleProductionUpdated}
        onProductionDeleted={handleProductionDeleted}
      />
    </div>
  );
}
