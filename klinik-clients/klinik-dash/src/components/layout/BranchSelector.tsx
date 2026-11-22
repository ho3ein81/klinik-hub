'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';

interface BranchSelectorProps {
  clinicName?: string;
}

export const BranchSelector: React.FC<BranchSelectorProps> = ({ clinicName }) => {
  const t = useTranslations('sidebar');

  return (
    <div className="px-1">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-dimmed">
        {t('branchLabel')}
      </span>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-bg p-2.5">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-text-muted" />
        <span className="truncate text-xs font-semibold text-text-main">
          {clinicName ?? t('branchLoading')}
        </span>
      </div>
    </div>
  );
};
