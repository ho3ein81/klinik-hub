'use client';

import { clinicUserAvatarUrl, patientAvatarUrl } from '@/services';
import { useProtectedImage } from '@/hooks/useProtectedImage';
import { cn, initials } from '@/lib/utils';

interface AvatarProps {
  firstName: string;
  lastName: string;
  avatar?: string | null;
  size?: 'sm' | 'md' | 'lg';
  /** Which read-resources endpoint the avatar filename belongs to. */
  kind?: 'clinicUser' | 'patient';
  className?: string;
}

const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
};

// sm/md are rendered small enough that the 150x150 thumbnail is plenty; lg
// (profile/edit previews) benefits from the sharper 400x400 variant.
const backendSize: Record<NonNullable<AvatarProps['size']>, 't' | 'm'> = {
  sm: 't',
  md: 't',
  lg: 'm',
};

export function Avatar({
  firstName,
  lastName,
  avatar,
  size = 'md',
  kind = 'clinicUser',
  className,
}: AvatarProps) {
  const urlFor = kind === 'patient' ? patientAvatarUrl : clinicUserAvatarUrl;
  const src = useProtectedImage(avatar ? urlFor(avatar, backendSize[size]) : null);

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-primary-tint font-semibold text-primary',
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`${firstName} ${lastName}`} className="h-full w-full object-cover" />
      ) : (
        <span>{initials(firstName, lastName)}</span>
      )}
    </div>
  );
}
