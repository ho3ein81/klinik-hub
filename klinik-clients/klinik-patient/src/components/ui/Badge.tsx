import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'success' | 'neutral' | 'danger' | 'warning' | 'primary';
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  success: 'bg-status-completed-bg text-status-completed-fg',
  danger: 'bg-status-rejected-bg text-status-rejected-fg',
  warning: 'bg-status-booked-bg text-status-booked-fg',
  neutral: 'bg-status-cancelled-bg text-status-cancelled-fg',
  primary: 'bg-primary-tint text-primary',
};

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
