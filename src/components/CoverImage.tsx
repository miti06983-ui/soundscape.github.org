import React, { useState, useEffect, useRef } from 'react';
import { Music2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface CoverImageProps {
  blob?: Blob | string;
  className?: string;
  iconSize?: number;
  darkMode?: boolean;
}

// Global cache for blob URLs to avoid flickering on re-renders
const urlCache = new WeakMap<Blob, string>();

export const CoverImage = React.memo(({ blob, className, iconSize = 24, darkMode = true }: CoverImageProps) => {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const prevBlobRef = useRef<Blob | string | undefined>(undefined);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      setError(false);
      return;
    }

    if (blob === prevBlobRef.current) return;
    prevBlobRef.current = blob;

    if (typeof blob === 'string') {
      setUrl(blob);
      setError(false);
      return;
    }

    if (!(blob instanceof Blob)) {
      setUrl(null);
      setError(false);
      return;
    }

    // Check cache
    if (urlCache.has(blob)) {
      setUrl(urlCache.get(blob) || null);
      setError(false);
      return;
    }

    let isMounted = true;
    const newUrl = URL.createObjectURL(blob);
    urlCache.set(blob, newUrl);
    
    // We don't revoke immediately anymore to stay in cache, 
    // but we'll test it first
    const img = new Image();
    img.onload = () => {
      if (isMounted) {
        setUrl(newUrl);
        setError(false);
      }
    };
    img.onerror = () => {
      if (isMounted) {
        setError(true);
        // If it's bad, remove from cache
        urlCache.delete(blob);
        URL.revokeObjectURL(newUrl);
      }
    };
    img.src = newUrl;

    return () => {
      isMounted = false;
      // We keep it in WeakMap cache, so it'll be garbage collected 
      // when the Blob is no longer used elsewhere. 
      // Manual revocation is tricky with caching.
    };
  }, [blob]);

  if (!url || error) {
    return (
      <div className={cn(darkMode ? "bg-zinc-800 text-zinc-600" : "bg-gray-200 text-gray-500", "flex items-center justify-center", className)}>
        <Music2 size={iconSize} />
      </div>
    );
  }

  return (
    <img 
      src={url} 
      className={cn("object-cover", className)} 
      alt="" 
      onError={() => setError(true)}
      loading="lazy"
    />
  );
});
