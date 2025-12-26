import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { ImageCard } from '@/components/ImageCard';
import { UploadDialog } from '@/components/UploadDialog';
import { ImagePreviewDialog } from '@/components/ImagePreviewDialog';
import { Button } from '@/components/ui/button';
import { 
  getAllImages, 
  getRepoContents, 
  ImageFile, 
  RepoContent, 
  downloadFileAuthenticated, 
  downloadMultipleFilesAuthenticated,
  deleteFile
} from '@/lib/github';
import { 
  Upload, 
  Download, 
  Loader2, 
  ImageIcon, 
  ChevronLeft, 
  CheckSquare, 
  Square
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Repository() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const { token, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [images, setImages] = useState<ImageFile[]>([]);
  const [folders, setFolders] = useState<RepoContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [previewImage, setPreviewImage] = useState<ImageFile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ImageFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!authLoading && !token) {
      navigate('/');
    }
  }, [token, authLoading, navigate]);

  const fetchData = useCallback(async (showLoading = true) => {
    if (!token || !owner || !repo) return;
    
    if (showLoading) setIsLoading(true);
    try {
      const [imagesData, contentsData] = await Promise.all([
        getAllImages(token, owner, repo),
        getRepoContents(token, owner, repo).catch(() => [])
      ]);
      
      setImages(imagesData);
      setFolders(contentsData.filter(item => item.type === 'dir'));
    } catch (error) {
      toast.error('Failed to load repository');
    } finally {
      setIsLoading(false);
    }
  }, [token, owner, repo]);

  const handleUploaded = useCallback((uploadedFiles: { name: string; path: string; localUrl: string }[]) => {
    // Immediately add uploaded images to UI with local URLs
    const newImages: ImageFile[] = uploadedFiles.map((file, index) => ({
      name: file.name,
      path: file.path,
      sha: `temp-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      size: 0,
      type: 'file' as const,
      download_url: file.localUrl,
      html_url: '',
    }));
    
    setImages(prev => [...newImages, ...prev]);
    
    // Background refresh to get real data - replace temp images with real ones
    setTimeout(async () => {
      if (!token || !owner || !repo) return;
      try {
        const imagesData = await getAllImages(token, owner, repo);
        // Replace all images to avoid duplicates
        setImages(imagesData);
      } catch (error) {
        console.error('Failed to refresh images', error);
      }
    }, 2000);
  }, [token, owner, repo]);

  useEffect(() => {
    if (token && owner && repo) {
      fetchData();
    }
  }, [token, owner, repo, fetchData]);

  const toggleImageSelection = (image: ImageFile) => {
    const newSelection = new Set(selectedImages);
    if (newSelection.has(image.sha)) {
      newSelection.delete(image.sha);
    } else {
      newSelection.add(image.sha);
    }
    setSelectedImages(newSelection);
  };

  const selectAll = () => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(images.map(img => img.sha)));
    }
  };

  const handleSingleDownload = async (image: ImageFile) => {
    if (!token || !owner || !repo) return;
    
    try {
      await downloadFileAuthenticated(token, owner, repo, image.path, image.sha, image.name);
      toast.success(`Downloaded ${image.name}`);
    } catch {
      toast.error('Failed to download');
    }
  };

  const handleBulkDownload = async () => {
    if (!token || !owner || !repo) return;
    
    const selectedFiles = images.filter(img => selectedImages.has(img.sha));
    if (selectedFiles.length === 0) return;

    setIsDownloading(true);
    try {
      const { success, failed } = await downloadMultipleFilesAuthenticated(token, owner, repo, selectedFiles);
      
      if (failed === 0) {
        toast.success(`Downloaded ${success} files`);
      } else if (success > 0) {
        toast.warning(`Downloaded ${success} files, ${failed} failed`);
      } else {
        toast.error('Failed to download files');
      }
      
      setSelectedImages(new Set());
    } catch {
      toast.error('Failed to download');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !owner || !repo || !deleteTarget) return;

    setIsDeleting(true);
    try {
      await deleteFile(token, owner, repo, deleteTarget.path, deleteTarget.sha, `Delete ${deleteTarget.name}`);
      
      // Remove from state - API succeeded so no refresh needed
      setImages(prev => prev.filter(img => img.sha !== deleteTarget.sha));
      setSelectedImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(deleteTarget.sha);
        return newSet;
      });
      
      toast.success(`Deleted ${deleteTarget.name}`);
      setDeleteTarget(null);
    } catch (error) {
      toast.error('Failed to delete');
      // Refresh on error to restore correct state
      fetchData(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8">
        {/* Breadcrumb & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link to="/dashboard">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{repo}</h1>
              <p className="text-sm text-muted-foreground">
                {images.length} {images.length === 1 ? 'image' : 'images'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedImages.size > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleBulkDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download ({selectedImages.size})
              </Button>
            )}
            <Button size="sm" onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </div>
        </div>

        {/* Selection controls */}
        {images.length > 0 && (
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
            <Button variant="ghost" size="sm" onClick={selectAll} className="h-8 text-xs">
              {selectedImages.size === images.length ? (
                <CheckSquare className="h-4 w-4 mr-1" />
              ) : (
                <Square className="h-4 w-4 mr-1" />
              )}
              {selectedImages.size === images.length ? 'Deselect all' : 'Select all'}
            </Button>
            {selectedImages.size > 0 && (
              <span className="text-xs text-muted-foreground">
                {selectedImages.size} selected
              </span>
            )}
          </div>
        )}

        {/* Images grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : images.length > 0 ? (
          <div className="image-grid">
            {images.map((image) => (
              <ImageCard
                key={image.sha}
                image={image}
                owner={owner!}
                repo={repo!}
                isSelected={selectedImages.has(image.sha)}
                onSelect={toggleImageSelection}
                onDownload={handleSingleDownload}
                onDelete={setDeleteTarget}
                onPreview={setPreviewImage}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium mb-1">No images</p>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your first photos
            </p>
            <Button size="sm" onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </div>
        )}
      </main>

      {/* Upload Dialog */}
      {owner && repo && (
        <UploadDialog
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          owner={owner}
          repo={repo}
          folders={folders}
          onUploaded={handleUploaded}
        />
      )}

      {/* Image Preview Dialog */}
      <ImagePreviewDialog
        image={previewImage}
        images={images}
        owner={owner!}
        repo={repo!}
        onClose={() => setPreviewImage(null)}
        onNavigate={setPreviewImage}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}