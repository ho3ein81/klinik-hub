'use client';

import { useEffect, useState } from 'react';
import { fetchBlobUrl } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/config/api.config';
import { cn, initials } from '@/lib/utils';

interface AvatarProps {
  firstName: string;
  lastName: string;
  avatar?: string | null;
  size?: 'sm' | 'md' | 'lg';
  /** Doctor/staff avatars are served publicly; a patient's own avatar needs their Bearer token. */
  kind?: 'doctor' | 'staff' | 'patient';
  className?: string;
}

const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
};

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
  kind = 'doctor',
  className,
}: AvatarProps) {
  // Doctor and staff avatars are public, so their URL is known during render —
  // and must be, or the <img> is missing from the server-rendered HTML and the
  // faces never reach Google Images. Only a patient's own avatar needs the
  // token-authenticated blob fetch, which can only happen in the browser.
  const publicSrc =
    avatar && kind === 'doctor'
      ? API_ENDPOINTS.doctors.resource(avatar, backendSize[size])
      : avatar && kind === 'staff'
        ? API_ENDPOINTS.staff.resource(avatar, backendSize[size])
        : null;

  const [blobSrc, setBlobSrc] = useState<string | null>(null);
  const src = publicSrc ?? blobSrc;

  useEffect(() => {
    if (!avatar || kind !== 'patient') {
      setBlobSrc(null);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    fetchBlobUrl(API_ENDPOINTS.patients.resource(avatar, backendSize[size]))
      .then((blobUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(blobUrl);
          return;
        }
        objectUrl = blobUrl;
        setBlobSrc(blobUrl);
      })
      .catch(() => setBlobSrc(null));

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [avatar, kind, size]);

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
