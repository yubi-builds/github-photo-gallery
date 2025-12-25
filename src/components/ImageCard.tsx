import { ImageFile } from '@/lib/github';
import { cn } from '@/lib/utils';
import { Check, Download, Trash2, Eye } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AuthenticatedImage } from '@/components/AuthenticatedImage';

interface ImageCardProps {
  image: ImageFile;
  owner: string;
  repo: string;
  isSelected: boolean;
  onSelect: (image: ImageFile) => void;
  onDownload: (image: ImageFile) => void;
  onDelete: (image: ImageFile) => void;
  onPreview: (image: ImageFile) => void;
}

export function ImageCard({ 
  image,
  owner,
  repo,
  isSelected, 
  onSelect, 
  onDownload, 
  onDelete,
  onPreview 
}: ImageCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "relative group rounded-md overflow-hidden bg-secondary border transition-all cursor-pointer",
        isSelected 
          ? "border-foreground ring-1 ring-foreground" 
          : "border-border hover:border-muted-foreground"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(image)}
    >
      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="aspect-square bg-secondary animate-pulse" />
      )}
      
      {/* Image */}
      <AuthenticatedImage
        owner={owner}
        repo={repo}
        path={image.path}
        sha={image.sha}
        fallbackUrl={image.download_url}
        alt={image.name}
        className={cn(
          "aspect-square object-cover w-full transition-transform duration-200",
          isLoaded ? "opacity-100" : "opacity-0 absolute inset-0",
          isHovered && "scale-[1.02]"
        )}
        onLoad={() => setIsLoaded(true)}
      />
      
      {/* Selection checkbox */}
      <div
        className={cn(
          "absolute top-2 left-2 h-5 w-5 rounded border flex items-center justify-center transition-all",
          isSelected 
            ? "bg-foreground border-foreground" 
            : "bg-background/80 backdrop-blur-sm border-border",
          !isSelected && !isHovered && "opacity-0 group-hover:opacity-100"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(image);
        }}
      >
        {isSelected && <Check className="h-3 w-3 text-background" />}
      </div>
      
      {/* Hover overlay with actions */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-medium truncate max-w-[50%]">
          {image.name}
        </p>
        
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 bg-background/50 backdrop-blur-sm hover:bg-background"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(image);
            }}
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 bg-background/50 backdrop-blur-sm hover:bg-background"
            onClick={(e) => {
              e.stopPropagation();
              onDownload(image);
            }}
          >
            <Download className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 bg-background/50 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(image);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
