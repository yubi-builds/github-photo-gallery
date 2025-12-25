import { ImageFile } from '@/lib/github';
import { cn } from '@/lib/utils';
import { Check, Download, Trash2, Eye } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ImageCardProps {
  image: ImageFile;
  isSelected: boolean;
  onSelect: (image: ImageFile) => void;
  onDownload: (image: ImageFile) => void;
  onDelete: (image: ImageFile) => void;
  onPreview: (image: ImageFile) => void;
}

export function ImageCard({ 
  image, 
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
        "relative group rounded-lg overflow-hidden bg-card border-2 transition-all duration-200 cursor-pointer",
        isSelected 
          ? "border-primary ring-2 ring-primary/30" 
          : "border-border/50 hover:border-border"
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
      <img
        src={image.download_url}
        alt={image.name}
        className={cn(
          "aspect-square object-cover w-full transition-transform duration-300",
          isLoaded ? "opacity-100" : "opacity-0 absolute inset-0",
          isHovered && "scale-105"
        )}
        onLoad={() => setIsLoaded(true)}
      />
      
      {/* Selection checkbox */}
      <div
        className={cn(
          "absolute top-2 left-2 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all duration-200",
          isSelected 
            ? "bg-primary border-primary" 
            : "bg-background/80 backdrop-blur-sm border-border",
          !isSelected && !isHovered && "opacity-0 group-hover:opacity-100"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(image);
        }}
      >
        {isSelected && <Check className="h-4 w-4 text-primary-foreground" />}
      </div>
      
      {/* Hover overlay with actions */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-between p-2"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-medium truncate max-w-[60%] text-foreground">
          {image.name}
        </p>
        
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-background/50 backdrop-blur-sm hover:bg-background/80"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(image);
            }}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-background/50 backdrop-blur-sm hover:bg-background/80"
            onClick={(e) => {
              e.stopPropagation();
              onDownload(image);
            }}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-background/50 backdrop-blur-sm hover:bg-destructive/80 hover:text-destructive-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(image);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
