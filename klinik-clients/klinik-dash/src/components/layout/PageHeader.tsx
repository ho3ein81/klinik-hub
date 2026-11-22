'use client'

import React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { ChevronLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface PageHeaderProps {
  title: string
  subtitle?: string
  description?: string
  backHref?: Route
  actions?: React.ReactNode
  children?: React.ReactNode
}

export default function PageHeader({
  title,
  subtitle,
  description,
  backHref,
  actions,
  children,
}: PageHeaderProps) {
  const t = useTranslations('common')

  // حفظ سازگاری عقب‌رو برای subtitle/description و actions/children
  const displaySubtitle = subtitle ?? description
  const displayActions = actions ?? children

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 min-w-0">
        {backHref && (
          <Link
            href={backHref}
            aria-label={t('back')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-card text-text-main transition-colors hover:bg-primary-tint"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        )}
        <div className="flex flex-col min-w-0">
          <h1 className="truncate text-xl font-semibold text-text-main sm:text-2xl">
            {title}
          </h1>
          {displaySubtitle && (
            <p className="mt-0.5 text-sm text-text-muted line-clamp-2 sm:line-clamp-1">
              {displaySubtitle}
            </p>
          )}
        </div>
      </div>

      {displayActions && (
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          {displayActions}
        </div>
      )}
    </header>
  )
}
