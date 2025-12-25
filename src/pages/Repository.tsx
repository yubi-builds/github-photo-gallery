import { useEffect, useState } from 'react';
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
  downloadFile, 
  downloadMultipleFiles,
  deleteFile
} from '@/lib/github';
import { 
  Upload, 
  Download, 
  Loader2, 
  ImageIcon, 
  ChevronLeft, 
  CheckSquare, 
  Square,
  Trash2
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

  const fetchData = async () => {
    if (!token || !owner || !repo) return;
    
    setIsLoading(true);
    try {
      const [imagesData, contentsData] = await Promise.all([
        getAllImages(token, owner, repo),
        getRepoContents(token, owner, repo).catch(() => [])
      ]);
      
      setImages(imagesData);
      setFolders(contentsData.filter(item => item.type === 'dir'));
    } catch (error) {
      toast.error('Failed to load repository contents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && owner && repo) {
      fetchData();
    }
  }, [token, owner, repo]);

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
    if (image.download_url) {
      try {
        await downloadFile(image.download_url, image.name);
        toast.success(`Downloaded ${image.name}`);
      } catch {
        toast.error('Failed to download file');
      }
    }
  };

  const handleBulkDownload = async () => {
    const selectedFiles = images.filter(img => selectedImages.has(img.sha));
    if (selectedFiles.length === 0) return;

    setIsDownloading(true);
    try {
      await downloadMultipleFiles(selectedFiles);
      toast.success(`Downloaded ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`);
      setSelectedImages(new Set());
    } catch {
      toast.error('Failed to download files');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !owner || !repo || !deleteTarget) return;

    setIsDeleting(true);
    try {
      await deleteFile(token, owner, repo, deleteTarget.path, deleteTarget.sha, `Delete ${deleteTarget.name}`);
      toast.success(`Deleted ${deleteTarget.name}`);
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete file');
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8">
        {/* Breadcrumb & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{repo}</h1>
              <p className="text-muted-foreground text-sm">
                {images.length} image{images.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedImages.size > 0 && (
              <Button 
                variant="secondary" 
                onClick={handleBulkDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Download ({selectedImages.size})
              </Button>
            )}
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        {/* Selection controls */}
        {images.length > 0 && (
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border/50">
            <Button variant="ghost" size="sm" onClick={selectAll} className="gap-2">
              {selectedImages.size === images.length ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {selectedImages.size === images.length ? 'Deselect All' : 'Select All'}
            </Button>
            {selectedImages.size > 0 && (
              <span className="text-sm text-muted-foreground">
                {selectedImages.size} selected
              </span>
            )}
          </div>
        )}

        {/* Images grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : images.length > 0 ? (
          <div className="image-grid">
            {images.map((image) => (
              <ImageCard
                key={image.sha}
                image={image}
                isSelected={selectedImages.has(image.sha)}
                onSelect={toggleImageSelection}
                onDownload={handleSingleDownload}
                onDelete={setDeleteTarget}
                onPreview={setPreviewImage}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No images yet</h3>
            <p className="text-muted-foreground mb-6">
              Upload your first photos to this repository
            </p>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Photos
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
          onUploaded={fetchData}
        />
      )}

      {/* Image Preview Dialog */}
      <ImagePreviewDialog
        image={previewImage}
        images={images}
        onClose={() => setPreviewImage(null)}
        onNavigate={setPreviewImage}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? 
              This action cannot be undone.
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
