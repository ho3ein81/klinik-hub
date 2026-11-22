'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { Home, Menu, UserRound, X } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  /** Resolved by the layout on the server, so the name is in the delivered HTML. */
  clinicName: string | null;
  showArticles: boolean;
}

export function Header({ clinicName, showArticles }: HeaderProps) {
  const t = useTranslations('nav');
  const rawPathname = usePathname() || '/';
  const pathname = rawPathname.replace(/^\/(en|de-CH)(\/|$)/, '/') || '/';
  const isHome = pathname === '/';

  const [activeSection, setActiveSection] = useState<string>('home');
  const [mobileOpen, setMobileOpen] = useState(false);

  const sectionIds = useMemo(
    () =>
      ['doctors', 'services', 'about', 'articles', 'contact'].filter(
        (id) => id !== 'articles' || showArticles,
      ),
    [showArticles],
  );

  const handleNavClick = useCallback(
    (id: string) => {
      setMobileOpen(false);
      if (!isHome) return;

      if (id === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setActiveSection('home');
        return;
      }

      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    },
    [isHome],
  );

  useEffect(() => {
    if (!isHome) return;

    const handleScroll = () => {
      if (window.scrollY < 200) {
        setActiveSection('home');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    );
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isHome, sectionIds]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const navItems = [
    { id: 'home', label: t('home') },
    { id: 'doctors', label: t('doctors') },
    { id: 'about', label: t('about') },
    { id: 'services', label: t('services') },
    ...(showArticles ? [{ id: 'articles', label: t('articles') }] : []),
    { id: 'contact', label: t('contact') },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface-card/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6">
        {/* Logo */}
        {/* No shrink-0 here: between lg and xl the brand + nav + actions are
            wider than the viewport, and the brand is the part that should
            yield. The truncate/min-w-0 below only work if it can shrink. */}
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary shadow-subtle sm:h-9 sm:w-9">
            <svg
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-surface-card sm:h-5 sm:w-5"
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
          <div className="flex flex-col min-w-0">
            <span className="truncate text-base font-bold leading-tight tracking-tight text-text-main sm:text-lg">
              {clinicName ?? '\u00a0'}
            </span>
            <span className="hidden truncate text-[10px] leading-none text-text-dimmed sm:block">
              {t('tagline')}
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        {isHome && (
          <nav className="hidden shrink-0 items-center gap-0.5 lg:flex">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className="group relative whitespace-nowrap px-2.5 py-2 text-sm font-medium transition-colors xl:px-3.5"
                >
                  <span
                    className={`transition-colors duration-200 ${
                      isActive
                        ? 'text-primary'
                        : 'text-text-muted group-hover:text-text-main'
                    }`}
                  >
                    {item.label}
                  </span>
                  <span
                    className={`absolute bottom-0 left-1/2 h-[2.5px] -translate-x-1/2 rounded-full bg-primary transition-all duration-300 ease-out ${
                      isActive ? 'w-5/6 opacity-100' : 'w-0 opacity-0'
                    }`}
                  />
                </button>
              );
            })}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {!isHome && (
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-text-muted transition-colors hover:text-text-main sm:px-3"
            >
              <Home className="h-4 w-4" />
              <span className="hidden md:inline">{t('home')}</span>
            </Link>
          )}

          <Link
            href="/patient"
            className={`flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition-colors sm:px-3 ${
              pathname === '/patient'
                ? 'bg-primary-tint text-primary'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <UserRound className="h-4 w-4" />
            <span className="hidden md:inline">{t('myAccount')}</span>
          </Link>

          {isHome && (
            <Button
              size="sm"
              className="hidden md:inline-flex"
              onClick={() => handleNavClick('doctors')}
            >
              {t('bookAppointment')}
            </Button>
          )}

          {isHome && (
            <button
              type="button"
              className="lg:hidden rounded-lg p-2 text-text-muted hover:text-text-main hover:bg-surface-bg transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && isHome && (
        <div className="lg:hidden border-t border-border bg-surface-card">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`relative rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-tint text-primary pl-5'
                      : 'text-text-muted hover:text-text-main hover:bg-surface-bg'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-1.5 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-primary" />
                  )}
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="flex items-center justify-between border-t border-border px-4 py-3 sm:hidden">
            <span className="text-xs text-text-dimmed">{t('home')}</span>
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </header>
  );
}