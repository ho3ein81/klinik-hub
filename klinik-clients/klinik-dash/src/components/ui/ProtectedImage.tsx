'use client';

import { ImageIcon } from 'lucide-react';
import { useProtectedImage } from '@/hooks/useProtectedImage';
import { cn } from '@/lib/utils';

interface ProtectedImageProps {
  url: string | null;
  alt: string;
  className?: string;
}

export function ProtectedImage({ url, alt, className }: ProtectedImageProps) {
  const src = useProtectedImage(url);

  if (!src) {
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
  return <img src={src} alt={alt} className={cn('object-cover', className)} />;
}
