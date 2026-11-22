'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { getCurrentUser } from '@/lib/auth';
import { Avatar } from '@/components/ui/Avatar';
import type { ClinicUser } from '@/types/domain';

const roleKeyMap: Partial<Record<ClinicUser['type'], string>> = {
  ADMIN: 'roleAdmin',
  DOCTOR: 'roleDoctor',
  NURSE: 'roleNurse',
  RECEPTIONIST: 'roleReceptionist',
};

export const UserProfileCard = () => {
  const t = useTranslations('sidebar');
  const locale = useLocale();
  const [user, setUser] = useState<ClinicUser | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  if (!user) {
    return <div className="h-9" />;
  }

  const roleKey = user.type ? (roleKeyMap[user.type] ?? 'roleAdmin') : 'roleAdmin';

  return (
    <Link
      href={`/${locale}/profile` as Route}
      className="-mx-1 flex items-center gap-3 rounded-lg px-1 py-1 transition-colors hover:bg-surface-bg"
    >
      <Avatar firstName={user.firstName} lastName={user.lastName} avatar={user.avatar} size="sm" />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-semibold text-text-main">
          {user.firstName} {user.lastName}
        </span>
        <span className="text-[11px] text-text-muted">{t(roleKey)}</span>
      </div>
    </Link>
  );
};
