"use client";

import { useState, useEffect } from "react";
import { getFlocks } from "@/server/flocks";
import { toast } from "sonner";

interface Flock {
  id: string;
  batchCode: string;
  currentCount: number;
}

export function useProductionDialog(open: boolean) {
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [flocksLoading, setFlocksLoading] = useState(false);

  // Fetch flocks when dialog opens
  useEffect(() => {
    if (open) {
      const fetchFlocks = async () => {
        setFlocksLoading(true);
        try {
          const result = await getFlocks({}, { page: 1, limit: 100 });
          if (result.success && result.data) {
            setFlocks(result.data.map(flock => ({
              id: flock.id,
              batchCode: flock.batchCode,
              currentCount: flock.currentCount
            })));
          } else {
            console.error("Failed to fetch flocks:", result.message);
            toast.error("Failed to fetch flocks");
            setFlocks([]);
          }
        } catch (error) {
          console.error("Error fetching flocks:", error);
          toast.error("Error fetching flocks");
          setFlocks([]);
        } finally {
          setFlocksLoading(false);
        }
      };
      fetchFlocks();
    }
  }, [open]);

  return {
    flocks,
    flocksLoading
  };
}
