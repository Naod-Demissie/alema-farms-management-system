import { useState, useEffect, useRef } from 'react';
import { ColumnDef, VisibilityState } from '@tanstack/react-table';

export function useMobileColumns<TData>(columns: ColumnDef<TData>[], columnVisibility: VisibilityState) {
  const [isMobile, setIsMobile] = useState(false);
  const mountedRef = useRef(true);

  // Check if screen is mobile size
  useEffect(() => {
    const checkMobile = () => {
      if (mountedRef.current) {
        setIsMobile(window.innerWidth < 768); // md breakpoint
      }
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup function
    return () => {
      mountedRef.current = false;
      window.removeEventListener('resize', checkMobile);
    };
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
