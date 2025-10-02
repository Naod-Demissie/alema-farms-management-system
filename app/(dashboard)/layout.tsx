"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
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

  useEffect(() => {
    console.log('[DashboardLayout] Session state changed:', { 
      isPending, 
      hasSession: !!session?.user, 
      userEmail: session?.user?.email 
    });
    
    if (!isPending && !session?.user) {
      // Redirect to signin with callback URL
      const currentPath = window.location.pathname;
      console.log('[DashboardLayout] No session found, redirecting to signin with callback:', currentPath);
      router.replace(`/signin?callbackUrl=${encodeURIComponent(currentPath)}`);
    }
  }, [session, isPending, router]);

  // Show loading while checking authentication
  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Checking authentication...</p>
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
                    <p className="mt-2 text-sm text-muted-foreground">Loading dashboard...</p>
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
