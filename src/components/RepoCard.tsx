import { Repository, updateRepoVisibility, deleteRepo, renameRepo } from '@/lib/github';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Folder, Lock, Globe, MoreHorizontal, Trash2, ExternalLink, Eye, EyeOff, ImageIcon, Pencil, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface RepoCardProps {
  repo: Repository;
  onUpdate: () => void;
  onRename: (oldName: string, updatedRepo: Repository) => void;
}

export function RepoCard({ repo, onUpdate, onRename }: RepoCardProps) {
  const { token } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(repo.name);

  const handleToggleVisibility = async () => {
    if (!token) return;
    
    setIsUpdatingVisibility(true);
    try {
      await updateRepoVisibility(token, repo.owner.login, repo.name, !repo.private);
      toast.success(`Repository is now ${repo.private ? 'public' : 'private'}`);
      onUpdate();
    } catch (error) {
      toast.error('Failed to update visibility');
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const handleRename = async () => {
    if (!token || !newName.trim() || newName === repo.name) return;
    
    const oldName = repo.name;
    const trimmedNewName = newName.trim();
    
    setIsRenaming(true);
    try {
      const updatedRepo = await renameRepo(token, repo.owner.login, oldName, trimmedNewName);
      // Update with the full repo object returned from GitHub API
      onRename(oldName, updatedRepo);
      toast.success(`Repository renamed to ${trimmedNewName}`);
      setShowRenameDialog(false);
    } catch (error) {
      console.error('Rename error:', error);
      toast.error('Failed to rename repository');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!token) return;
    
    setIsDeleting(true);
    try {
      await deleteRepo(token, repo.owner.login, repo.name);
      toast.success('Repository deleted');
      onUpdate();
    } catch (error) {
      toast.error('Failed to delete repository');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const openRenameDialog = () => {
    setNewName(repo.name);
    setShowRenameDialog(true);
  };

  return (
    <>
      <div className="card-minimal p-4 group transition-all">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <Folder className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm truncate">{repo.name}</h3>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={openRenameDialog}>
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleVisibility} disabled={isUpdatingVisibility}>
                {repo.private ? (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Make Public
                  </>
                ) : (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Make Private
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on GitHub
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
          {repo.description || 'No description'}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-normal gap-1">
              {repo.private ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
              {repo.private ? 'Private' : 'Public'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(repo.updated_at), { addSuffix: true })}
            </span>
          </div>
          
          <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
            <Link to={`/repo/${repo.owner.login}/${repo.name}`}>
              <ImageIcon className="h-3 w-3 mr-1" />
              Photos
            </Link>
          </Button>
        </div>
      </div>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Repository</DialogTitle>
            <DialogDescription>
              Enter a new name for the repository.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="repo-name" className="text-sm font-medium">
              New name
            </Label>
            <Input
              id="repo-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new name"
              className="mt-2"
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRename} 
              disabled={isRenaming || !newName.trim() || newName === repo.name}
            >
              {isRenaming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Renaming...
                </>
              ) : (
                'Rename'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Repository</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{repo.name}</strong>? This cannot be undone.
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
    </>
  );
}