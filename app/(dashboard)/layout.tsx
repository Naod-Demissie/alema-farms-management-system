"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { useSession } from "@/lib/auth-client";
import { AppSidebar } from "@/components/sidebar/new-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const t = useTranslations('dashboard');

  useEffect(() => {
    console.log('[DashboardLayout] Session state changed:', { 
      isPending, 
      hasSession: !!session?.user, 
      userEmail: session?.user?.email 
    });
    
    // Debug: Log environment variables and current state
    console.log('[DashboardLayout] Environment check:', {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NODE_ENV: process.env.NODE_ENV,
      currentURL: typeof window !== 'undefined' ? window.location.href : 'N/A',
      sessionExists: !!session,
      sessionUser: session?.user?.email || 'No user'
    });
    
    // Only redirect if we're sure there's no session (not just loading)
    if (!isPending && !session?.user) {
      // Add a small delay to prevent race conditions with session creation
      const timeoutId = setTimeout(() => {
        const currentPath = window.location.pathname;
        console.log('[DashboardLayout] No session found after delay, redirecting to signin with callback:', currentPath);
        router.replace(`/signin?callbackUrl=${encodeURIComponent(currentPath)}`);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [session, isPending, router]);

  // Show loading while checking authentication
  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">{t('checkingAuth')}</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!session?.user) {
    return null;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--sidebar-width-mobile": "calc(var(--spacing) * 64)",
          "--header-height": "calc(var(--spacing) * 12)",
          "--header-height-mobile": "calc(var(--spacing) * 10)",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-2 py-2 px-2 sm:gap-4 sm:py-4 sm:px-4 md:gap-6 md:py-6">
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">{t('loadingDashboard')}</p>
                  </div>
                </div>
              }>
                {children}
              </Suspense>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
