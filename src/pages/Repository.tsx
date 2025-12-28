import { useEffect, useState, useCallback, useMemo } from 'react';
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
  Square,
  Trash2,
  FolderOpen,
  ChevronDown,
  ChevronRight
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface FolderGroup {
  path: string;
  name: string;
  images: ImageFile[];
}

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
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  // Group images by folder
  const folderGroups = useMemo((): FolderGroup[] => {
    const groups = new Map<string, ImageFile[]>();
    
    images.forEach(image => {
      const pathParts = image.path.split('/');
      const folderPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
      
      if (!groups.has(folderPath)) {
        groups.set(folderPath, []);
      }
      groups.get(folderPath)!.push(image);
    });

    return Array.from(groups.entries())
      .map(([path, imgs]) => ({
        path,
        name: path || 'Root',
        images: imgs
      }))
      .sort((a, b) => a.path.localeCompare(b.path));
  }, [images]);

  const toggleFolderCollapse = (folderPath: string) => {
    setCollapsedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

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

  const handleUploaded = useCallback((uploadedFiles: ImageFile[]) => {
    setImages(prev => [...uploadedFiles, ...prev]);
    
    if (token && owner && repo) {
      getRepoContents(token, owner, repo)
        .then(contentsData => {
          setFolders(contentsData.filter(item => item.type === 'dir'));
        })
        .catch(() => {});
    }
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

  const selectAllInFolder = (folderImages: ImageFile[]) => {
    const folderShas = folderImages.map(img => img.sha);
    const allSelected = folderShas.every(sha => selectedImages.has(sha));
    
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        folderShas.forEach(sha => newSet.delete(sha));
      } else {
        folderShas.forEach(sha => newSet.add(sha));
      }
      return newSet;
    });
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
      fetchData(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!token || !owner || !repo || selectedImages.size === 0) return;

    const selectedFiles = images.filter(img => selectedImages.has(img.sha));
    setIsBulkDeleting(true);
    
    let successCount = 0;
    let failCount = 0;

    for (const file of selectedFiles) {
      try {
        await deleteFile(token, owner, repo, file.path, file.sha, `Delete ${file.name}`);
        successCount++;
      } catch {
        failCount++;
      }
    }

    if (successCount > 0) {
      setImages(prev => prev.filter(img => !selectedImages.has(img.sha)));
      setSelectedImages(new Set());
    }

    if (failCount === 0) {
      toast.success(`Deleted ${successCount} files`);
    } else if (successCount > 0) {
      toast.warning(`Deleted ${successCount} files, ${failCount} failed`);
    } else {
      toast.error('Failed to delete files');
    }

    setBulkDeleteConfirm(false);
    setIsBulkDeleting(false);
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
                {images.length} {images.length === 1 ? 'image' : 'images'} in {folderGroups.length} {folderGroups.length === 1 ? 'folder' : 'folders'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedImages.size > 0 && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setBulkDeleteConfirm(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete ({selectedImages.size})
                </Button>
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
              </>
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

        {/* Folder-wise images */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : images.length > 0 ? (
          <div className="space-y-6">
            {folderGroups.map((group) => {
              const isCollapsed = collapsedFolders.has(group.path);
              const folderShas = group.images.map(img => img.sha);
              const allSelected = folderShas.every(sha => selectedImages.has(sha));
              const someSelected = folderShas.some(sha => selectedImages.has(sha));
              
              return (
                <Collapsible
                  key={group.path}
                  open={!isCollapsed}
                  onOpenChange={() => toggleFolderCollapse(group.path)}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      <span>{group.name}</span>
                      <span className="text-muted-foreground font-normal">
                        ({group.images.length} {group.images.length === 1 ? 'image' : 'images'})
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectAllInFolder(group.images);
                      }}
                      className="h-6 px-2 text-xs ml-auto"
                    >
                      {allSelected ? (
                        <CheckSquare className="h-3 w-3 mr-1" />
                      ) : someSelected ? (
                        <Square className="h-3 w-3 mr-1 opacity-50" />
                      ) : (
                        <Square className="h-3 w-3 mr-1" />
                      )}
                      {allSelected ? 'Deselect' : 'Select'}
                    </Button>
                  </div>
                  <CollapsibleContent>
                    <div className="image-grid">
                      {group.images.map((image) => (
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
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
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

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedImages.size} Images</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedImages.size} selected images? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkDeleting ? 'Deleting...' : `Delete ${selectedImages.size} images`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}