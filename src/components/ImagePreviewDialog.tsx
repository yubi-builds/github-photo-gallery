import { ImageFile, downloadFile } from '@/lib/github';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImagePreviewDialogProps {
  image: ImageFile | null;
  images: ImageFile[];
  onClose: () => void;
  onNavigate: (image: ImageFile) => void;
}

export function ImagePreviewDialog({ image, images, onClose, onNavigate }: ImagePreviewDialogProps) {
  if (!image) return null;

  const currentIndex = images.findIndex(img => img.sha === image.sha);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const handleDownload = () => {
    if (image.download_url) {
      downloadFile(image.download_url, image.name);
    }
  };

  const handlePrev = () => {
    if (hasPrev) {
      onNavigate(images[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onNavigate(images[currentIndex + 1]);
    }
  };

  return (
    <Dialog open={!!image} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-background/95 backdrop-blur-xl border-border/50">
        <div className="relative w-full h-full">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-background/80 to-transparent">
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium truncate max-w-[300px]">{image.name}</p>
              <span className="text-xs text-muted-foreground">
                {currentIndex + 1} / {images.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Image */}
          <div className="flex items-center justify-center p-16 min-h-[60vh]">
            <img
              src={image.download_url}
              alt={image.name}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>

          {/* Navigation arrows */}
          {hasPrev && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          {hasNext && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80"
              onClick={handleNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
