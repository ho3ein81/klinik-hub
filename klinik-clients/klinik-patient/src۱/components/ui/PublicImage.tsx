'use client';

import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PublicImageProps {
  url: string | null;
  alt: string;
  className?: string;
}

/** These read-resources endpoints are public (no auth), so a plain <img> works. */
export function PublicImage({ url, alt, className }: PublicImageProps) {
  if (!url) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-surface-bg text-text-dimmed',
          className
        )}
      >
        <ImageIcon className="h-8 w-8 stroke-1" />
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={cn('object-cover', className)} />;
}
