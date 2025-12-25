import { Repository, updateRepoVisibility, deleteRepo } from '@/lib/github';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Folder, Lock, Unlock, MoreVertical, Trash2, ExternalLink, Eye, EyeOff, ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface RepoCardProps {
  repo: Repository;
  onUpdate: () => void;
}

export function RepoCard({ repo, onUpdate }: RepoCardProps) {
  const { token } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

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

  return (
    <>
      <Card className="glass-card glow-border group overflow-hidden transition-all duration-300 hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Folder className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {repo.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Updated {formatDistanceToNow(new Date(repo.updated_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
        </CardHeader>
        
        <CardContent className="pb-3">
          {repo.description ? (
            <p className="text-sm text-muted-foreground line-clamp-2">{repo.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground/50 italic">No description</p>
          )}
        </CardContent>
        
        <CardFooter className="flex items-center justify-between pt-3 border-t border-border/50">
          <Badge variant={repo.private ? 'secondary' : 'outline'} className="gap-1.5">
            {repo.private ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
            {repo.private ? 'Private' : 'Public'}
          </Badge>
          
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link to={`/repo/${repo.owner.login}/${repo.name}`}>
              <ImageIcon className="h-4 w-4" />
              View Photos
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Repository</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{repo.name}</strong>? This action cannot be undone and all files will be permanently removed.
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
