'use client'
import { Inbox } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface EmptyStateProps {
  message: string
  hint?: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({ message, hint, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-tint">
        <Inbox className="h-8 w-8 text-primary" />
      </div>
      <p className="text-base font-medium text-text-main">{message}</p>
      {hint && <p className="text-sm text-text-muted">{hint}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  )
}
