'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { LogOut, X } from 'lucide-react';
import { NAV_ITEMS } from '@/config/nav';
import { BranchSelector } from './BranchSelector';
import { UserProfileCard } from './UserProfileCard';
import { LanguageSwitcher } from './LanguageSwitcher';
import { getCurrentUser } from '@/lib/auth';
import { getClinic, logout } from '@/services';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const t = useTranslations('navigation');
  const locale = useLocale();
  const router = useRouter();
  const rawPathname = usePathname() || '/';
  const fetchedClinicRef = useRef(false);

  const pathname = rawPathname.replace(new RegExp(`^/${locale}(/|$)`), '/') || '/';

  const [userType, setUserType] = useState<string | undefined>(undefined);
  const [clinicName, setClinicName] = useState('Clinic');

  useEffect(() => {
    setUserType(getCurrentUser()?.type);
  }, []);

  useEffect(() => {
    if (fetchedClinicRef.current) return;
    fetchedClinicRef.current = true;

    const user = getCurrentUser();
    if (!user?.clinicId) return;

    getClinic(user.clinicId)
      .then((clinic) => {
        if (clinic?.name) {
          setClinicName(clinic.name);
          document.title = clinic.name;
        }
      })
      .catch(() => {
        setClinicName('Clinic');
      });
  }, []);

  const handleLogout = () => {
    logout();
    router.replace(`/${locale}/auth` as Route);
  };

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.href === '/users') return userType === 'ADMIN';
    if (item.href === '/doctor-availabilities') {
      return userType === 'ADMIN' || userType === 'DOCTOR';
    }
    return true;
  });

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-text-main/30 backdrop-blur-xs transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 lg:w-64 bg-surface-card border-r border-border flex flex-col justify-between p-5 shrink-0 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:min-h-screen ${isOpen ? 'translate-x-0 shadow-dropdown' : '-translate-x-full lg:shadow-none'
          }`}
      >
        <div className="flex-1 overflow-y-auto pr-0.5">
          <div className="flex items-center justify-between px-2 py-3 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center p-1.5 shadow-subtle shrink-0">
                <svg
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full text-surface-card"
                >
                  <path
                    d="M32 16V48M16 32H48"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-text-main tracking-tight">{clinicName}</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-bg transition-colors"
              aria-label={t('closeSidebar')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-5">
            <BranchSelector clinicName={clinicName} />
          </div>

          <nav className="space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;

              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              const targetHref = `/${locale}${item.href === '/' ? '' : item.href}` as Route;

              return (
                <Link
                  key={item.key}
                  href={targetHref}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                    ? 'bg-primary-tint text-primary font-semibold shadow-xs'
                    : 'text-text-muted hover:text-text-main hover:bg-surface-bg'
                    }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-text-muted'
                      }`}
                  />
                  <span>{t(item.key)}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 mt-auto border-t border-border space-y-4">
          <UserProfileCard />
          <LanguageSwitcher />
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-text-muted transition-all hover:bg-status-rejected-bg hover:text-status-rejected-fg"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
