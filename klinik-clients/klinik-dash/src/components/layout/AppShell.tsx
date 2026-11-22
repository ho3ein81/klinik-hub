'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-surface-bg">

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />


      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
