'use client';

import React from 'react';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onOpenSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSidebar }) => {
  return (
    <header className="flex items-center gap-2 px-3 sm:px-4 lg:px-6 py-3.5 bg-surface-card/60 backdrop-blur-md border-b border-border sticky top-0 z-30 lg:hidden">
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label="Open menu"
        className="flex items-center justify-center w-9 h-9 bg-surface-card border border-border rounded-xl text-text-muted hover:text-primary transition-all shrink-0"
      >
        <Menu className="w-5 h-5" />
      </button>
    </header>
  );
};
