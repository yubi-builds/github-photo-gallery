import { useState, useEffect } from 'react';
import { getAuthenticatedImageUrl } from '@/lib/github';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface AuthenticatedImageProps {
  owner: string;
  repo: string;
  path: string;
  sha: string;
  fallbackUrl?: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
}

export function AuthenticatedImage({
  owner,
  repo,
  path,
  sha,
  fallbackUrl,
  alt,
  className,
  onLoad,
}: AuthenticatedImageProps) {
  const { token } = useAuth();
  const [imageUrl, setImageUrl] = useState<string | null>(fallbackUrl || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadImage() {
      if (!token || sha.startsWith('temp-')) {
        // Use fallback for temp images (optimistic UI)
        if (fallbackUrl) {
          setImageUrl(fallbackUrl);
          setIsLoading(false);
        }
        return;
      }

      try {
        const url = await getAuthenticatedImageUrl(token, owner, repo, path, sha);
        if (mounted) {
          setImageUrl(url);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          // Fall back to download_url if API fails
          if (fallbackUrl) {
            setImageUrl(fallbackUrl);
          }
          setError(true);
          setIsLoading(false);
        }
      }
    }

    loadImage();

    return () => {
      mounted = false;
    };
  }, [token, owner, repo, path, sha, fallbackUrl]);

  if (isLoading || !imageUrl) {
    return <div className={cn("bg-secondary animate-pulse", className)} />;
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onLoad={onLoad}
      onError={() => {
        if (fallbackUrl && imageUrl !== fallbackUrl) {
          setImageUrl(fallbackUrl);
        } else {
          setError(true);
        }
      }}
    />
  );
}