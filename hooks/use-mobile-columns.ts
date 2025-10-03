import { useState, useEffect } from 'react';
import { ColumnDef, VisibilityState } from '@tanstack/react-table';

export function useMobileColumns<TData>(columns: ColumnDef<TData>[], columnVisibility: VisibilityState) {
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Create mobile-overridden column visibility
  const mobileColumnVisibility = isMobile 
    ? Object.fromEntries(
        columns
          .filter(col => col.id !== 'actions')
          .map(col => [col.id || '', true])
      )
    : columnVisibility;

  return { isMobile, mobileColumnVisibility };
}
