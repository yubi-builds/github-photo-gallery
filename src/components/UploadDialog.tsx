import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadFile, fileToBase64, getRepoContents, RepoContent } from '@/lib/github';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Upload, FolderPlus, Image as ImageIcon, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface UploadedFile {
  name: string;
  path: string;
  localUrl: string;
}

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owner: string;
  repo: string;
  folders: RepoContent[];
  onUploaded: (uploadedFiles: UploadedFile[]) => void;
}

export function UploadDialog({ open, onOpenChange, owner, repo, folders, onUploaded }: UploadDialogProps) {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState('');
  const [createNewFolder, setCreateNewFolder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
    setFiles(prev => [...prev, ...imageFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!token || files.length === 0) return;

    const folderPath = createNewFolder ? newFolderName.trim() : selectedFolder;
    
    setIsUploading(true);
    setUploadProgress(0);

    const uploadedFiles: UploadedFile[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await fileToBase64(file);
        const path = folderPath ? `${folderPath}/${file.name}` : file.name;
        
        // Create local URL for immediate display
        const localUrl = URL.createObjectURL(file);
        uploadedFiles.push({ name: file.name, path, localUrl });
        
        await uploadFile(
          token,
          owner,
          repo,
          path,
          base64,
          `Upload ${file.name}`
        );
        
        setUploadProgress(((i + 1) / files.length) * 100);
      }

      toast.success(`Successfully uploaded ${files.length} file${files.length > 1 ? 's' : ''}`);
      onUploaded(uploadedFiles);
      onOpenChange(false);
      setFiles([]);
      setSelectedFolder('');
      setNewFolderName('');
      setCreateNewFolder(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload files');
      // Revoke any created URLs on error
      uploadedFiles.forEach(f => URL.revokeObjectURL(f.localUrl));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      onOpenChange(false);
      setFiles([]);
      setSelectedFolder('');
      setNewFolderName('');
      setCreateNewFolder(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Photos</DialogTitle>
          <DialogDescription>
            Upload images to your repository. Select a folder or create a new one.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Folder selection */}
          <div className="grid gap-2">
            <Label>Destination Folder</Label>
            <div className="flex gap-2">
              <Select
                value={createNewFolder ? '__new__' : (selectedFolder || '__root__')}
                onValueChange={(value) => {
                  if (value === '__new__') {
                    setCreateNewFolder(true);
                    setSelectedFolder('');
                  } else if (value === '__root__') {
                    setCreateNewFolder(false);
                    setSelectedFolder('');
                  } else {
                    setCreateNewFolder(false);
                    setSelectedFolder(value);
                  }
                }}
              >
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Root folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__root__">Root folder</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.path} value={folder.path}>
                      {folder.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="__new__">
                    <span className="flex items-center gap-2">
                      <FolderPlus className="h-4 w-4" />
                      Create new folder
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* New folder name input */}
          {createNewFolder && (
            <div className="grid gap-2">
              <Label htmlFor="newFolder">New Folder Name</Label>
              <Input
                id="newFolder"
                placeholder="my-photos"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
          )}

          {/* File upload area */}
          <div className="grid gap-2">
            <Label>Select Photos</Label>
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to select images or drag and drop
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Supports JPG, PNG, GIF, WebP, SVG
              </p>
            </div>
          </div>

          {/* Selected files preview */}
          {files.length > 0 && (
            <div className="grid gap-2">
              <Label>Selected Files ({files.length})</Label>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50"
                  >
                    <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate flex-1">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={files.length === 0 || isUploading || (createNewFolder && !newFolderName.trim())}
          >
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUploading ? 'Uploading...' : `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
