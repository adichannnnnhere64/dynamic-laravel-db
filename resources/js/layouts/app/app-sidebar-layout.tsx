"use client";

import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';
import { SonnerProvider } from '@/contexts/sonner-context';
import { InertiaFlashHandler } from '@/components/notification/inertia-flash-handler';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <SonnerProvider
          position="top-right"
          theme="light"
          richColors
          closeButton
        >
          <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
              <AppSidebarHeader breadcrumbs={breadcrumbs} />
              <InertiaFlashHandler />
              {children}
            </AppContent>
          </AppShell>
        </SonnerProvider>
    );
}
