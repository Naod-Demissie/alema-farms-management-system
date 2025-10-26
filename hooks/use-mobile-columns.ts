import { useState, useEffect, useRef, useMemo } from 'react';
import { ColumnDef, VisibilityState } from '@tanstack/react-table';

export function useMobileColumns<TData>(columns: ColumnDef<TData>[], columnVisibility: VisibilityState) {
  // Initialize with a function to check mobile state only once during initialization
  const [isMobile, setIsMobile] = useState(() => {
    // Only check window size if we're in the browser (not SSR)
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  const mountedRef = useRef(false);

  // Check if screen is mobile size
  useEffect(() => {
    // Mark as mounted
    mountedRef.current = true;
    
    const checkMobile = () => {
      if (mountedRef.current) {
        const mobile = window.innerWidth < 768; // md breakpoint
        setIsMobile(prev => prev !== mobile ? mobile : prev); // Only update if changed
      }
    };
    
    // Initial check - now safe to call since we're in useEffect
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
  const mobileColumnVisibility = useMemo(() => {
    return isMobile 
      ? Object.fromEntries(
          columns
            .filter(col => col.id !== 'actions')
            .map(col => [col.id || '', true])
        )
      : columnVisibility;
  }, [isMobile, columns, columnVisibility]);

  return { isMobile, mobileColumnVisibility };
}
